Pod::Spec.new do |s|
  s.name           = 'PhotoStyle'
  s.version        = '1.0.0'
  s.summary        = "Core Image's house style for MoreCoffee's photos"
  s.description    = "Resizes a photo, keeps it as the original, and writes its styled copy (duotone, dither) with Core Image."
  s.license        = 'UNLICENSED'
  s.author         = 'MoreCoffee'
  s.homepage       = 'https://github.com/'
  s.platforms      = {
    :ios => '17.0'
  }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'CoreImage', 'ImageIO'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
