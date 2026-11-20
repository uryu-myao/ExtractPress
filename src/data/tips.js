import { requireOptionalNativeModule } from 'expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TIP_IDS } from '../constants/tips';

/**
 * The tips' store connection (28e / 28g), through expo-iap (StoreKit 2).
 * Open only while Buy me a coffee is on screen: the hook connects on mount
 * and lets go on unmount.
 *
 * A build without the native module (a development build from before
 * expo-iap was added, the web) gets `available: false` and never touches
 * expo-iap, which would throw on its first call.
 *
 * Returns
 *   available  the store module is in this build
 *   prices     { [productId]: StoreKit's localised price string } once known
 *   loading    the products are still being fetched
 *   busy       the id whose payment sheet is up, or null
 *   outcome    the last purchase's result on this screen, or null:
 *                { kind: 'paid', id }    it went through (the thank-you)
 *                { kind: 'waiting', id } Ask to Buy: waiting for approval
 *                { kind: 'failed', id }  it didn't go through
 *              A cancel on Apple's sheet is not an outcome: nothing changes
 *              (Design Round 26 B6), and the last outcome stays as it was.
 *   buy(id)    opens Apple's payment sheet for that tip, no confirm of ours
 *
 * Every purchase that arrives is finished as consumable at once: a tip
 * delivers nothing, so there is nothing to check first, and an unfinished
 * one would come back on every launch. One that arrives on its own while
 * the screen is open (an Ask to Buy approved later, or one left unfinished
 * last time) is thanked the same way: it did go through.
 */
const IAP_AVAILABLE = requireOptionalNativeModule('ExpoIap') != null;

// Only required when present: expo-iap resolves its native module lazily,
// but a missing one throws on the first call.
const iap = IAP_AVAILABLE ? require('expo-iap') : null;

// Ask to Buy: StoreKit's .pending, which OpenIAP reports as deferred-payment.
const WAITING_CODES = new Set(['deferred-payment', 'pending']);

/** 'E_DEFERRED_PAYMENT', 'DeferredPayment' and 'deferred-payment' alike. */
const codeOf = (error) =>
  String(error?.code ?? '')
    .replace(/^E_/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();

/** What a failed or cancelled request means on the screen; null for a cancel. */
function outcomeOfError(error, id) {
  const code = codeOf(error);
  if (code === 'user-cancelled' || code === 'user-canceled') return null;
  if (WAITING_CODES.has(code)) return { kind: 'waiting', id };
  return { kind: 'failed', id };
}

export function useTips() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(IAP_AVAILABLE);
  const [busy, setBusy] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const busyRef = useRef(null);
  const mounted = useRef(true);

  const settle = useCallback((next) => {
    busyRef.current = null;
    if (!mounted.current) return;
    setBusy(null);
    if (next) setOutcome(next);
  }, []);

  // One purchase can reach us twice (the listener and requestPurchase's own
  // result); it is finished and thanked once.
  const seen = useRef(new Set());
  const onPurchase = useCallback(
    async (purchase) => {
      const id = purchase?.productId;
      if (!iap || !TIP_IDS.includes(id)) return;
      if (purchase.purchaseState === 'pending') {
        settle({ kind: 'waiting', id });
        return;
      }
      const key = purchase.transactionId ?? purchase.id ?? purchase.purchaseToken;
      if (key && seen.current.has(key)) return;
      if (key) seen.current.add(key);
      try {
        await iap.finishTransaction({ purchase, isConsumable: true });
      } catch (e) {
        // Paid all the same; StoreKit hands it back next launch and it is
        // finished then.
        if (__DEV__) console.warn('[tips] finishTransaction failed', e);
      }
      settle({ kind: 'paid', id });
    },
    [settle]
  );

  useEffect(() => {
    mounted.current = true;
    if (!iap) return undefined;

    const updated = iap.purchaseUpdatedListener(onPurchase);
    const failed = iap.purchaseErrorListener((error) => {
      if (!busyRef.current && !error.productId) return;
      settle(outcomeOfError(error, error.productId ?? busyRef.current));
    });

    (async () => {
      try {
        await iap.initConnection();
        const products = await iap.fetchProducts({ skus: TIP_IDS, type: 'in-app' });
        if (!mounted.current) return;
        setPrices(Object.fromEntries((products ?? []).map((p) => [p.id, p.displayPrice])));
      } catch (e) {
        if (__DEV__) console.warn('[tips] store unavailable', e);
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();

    return () => {
      mounted.current = false;
      updated.remove();
      failed.remove();
      iap.endConnection().catch(() => {});
    };
  }, [settle, onPurchase]);

  const buy = useCallback(
    async (id) => {
      if (!iap || busyRef.current) return;
      busyRef.current = id;
      setBusy(id);
      try {
        const result = await iap.requestPurchase({ request: { apple: { sku: id } }, type: 'in-app' });
        // The listener normally has it already; this covers one it skipped.
        for (const p of [result].flat()) if (p) await onPurchase(p);
      } catch (error) {
        // The listener may report the same failure; settling twice is harmless.
        if (busyRef.current === id) settle(outcomeOfError(error, id));
      }
    },
    [settle, onPurchase]
  );

  return { available: IAP_AVAILABLE, prices, loading, busy, outcome, buy };
}
