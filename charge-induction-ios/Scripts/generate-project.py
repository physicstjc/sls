#!/usr/bin/env python3
"""Regenerate the dependency-free Xcode project; stable IDs keep diffs readable."""
import hashlib, json, pathlib, plistlib
root = pathlib.Path(__file__).resolve().parents[1]
objects = {}
def uid(name): return hashlib.sha1(name.encode()).hexdigest()[:24].upper()
def add(identifier, isa, **fields):
    key = uid(identifier); objects[key] = dict(isa=isa, **fields); return key
source_names = ['ChargeLabApp.swift', 'ContentView.swift', 'LabStore.swift', 'ExperimentEntity.swift', 'LabARView.swift']
source_refs = [add(n, 'PBXFileReference', lastKnownFileType='sourcecode.swift', path=n, sourceTree='<group>') for n in source_names]
physics = add('physics', 'PBXFileReference', lastKnownFileType='sourcecode.swift', path='ChargePhysics.swift', sourceTree='<group>')
app_group = add('app-group', 'PBXGroup', children=source_refs, path='ChargeLab', sourceTree='<group>')
physics_group = add('physics-group', 'PBXGroup', children=[physics], path='ChargePhysics', sourceTree='<group>')
sources_group = add('sources-group', 'PBXGroup', children=[app_group, physics_group], path='Sources', sourceTree='<group>')
assets = add('assets', 'PBXFileReference', lastKnownFileType='folder.assetcatalog', path='Assets.xcassets', sourceTree='<group>')
privacy = add('privacy', 'PBXFileReference', lastKnownFileType='text.xml', path='PrivacyInfo.xcprivacy', sourceTree='<group>')
info = add('info', 'PBXFileReference', lastKnownFileType='text.plist.xml', path='Info.plist', sourceTree='<group>')
resources_group = add('resources-group', 'PBXGroup', children=[assets, privacy, info], path='Resources', sourceTree='<group>')
product = add('product', 'PBXFileReference', explicitFileType='wrapper.application', includeInIndex='0', path='ChargeLab.app', sourceTree='BUILT_PRODUCTS_DIR')
products = add('products', 'PBXGroup', children=[product], name='Products', sourceTree='<group>')
main = add('main', 'PBXGroup', children=[sources_group, resources_group, products], sourceTree='<group>')
source_phase = add('source-phase', 'PBXSourcesBuildPhase', buildActionMask='2147483647', files=[add('build-'+ref, 'PBXBuildFile', fileRef=ref) for ref in source_refs + [physics]], runOnlyForDeploymentPostprocessing='0')
resource_phase = add('resource-phase', 'PBXResourcesBuildPhase', buildActionMask='2147483647', files=[add('build-'+ref, 'PBXBuildFile', fileRef=ref) for ref in [assets, privacy]], runOnlyForDeploymentPostprocessing='0')
frameworks = add('frameworks', 'PBXFrameworksBuildPhase', buildActionMask='2147483647', files=[], runOnlyForDeploymentPostprocessing='0')
project_settings = {'IPHONEOS_DEPLOYMENT_TARGET': '18.0', 'CLANG_WARN_SUSPICIOUS_MOVE': 'YES', 'CLANG_ENABLE_OBJC_ARC': 'YES', 'GCC_WARN_UNDECLARED_SELECTOR': 'YES', 'CLANG_WARN__DUPLICATE_METHOD_MATCH': 'YES', 'CLANG_WARN_INFINITE_RECURSION': 'YES', 'SDKROOT': 'iphoneos', 'CLANG_WARN_BOOL_CONVERSION': 'YES', 'CLANG_WARN_UNREACHABLE_CODE': 'YES', 'ENABLE_STRICT_OBJC_MSGSEND': 'YES', 'CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING': 'YES', 'CLANG_WARN_STRICT_PROTOTYPES': 'YES', 'CLANG_WARN_ENUM_CONVERSION': 'YES', 'GCC_WARN_64_TO_32_BIT_CONVERSION': 'YES', 'CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER': 'YES', 'STRING_CATALOG_GENERATE_SYMBOLS': 'YES', 'SWIFT_VERSION': '5.0', 'GCC_WARN_UNINITIALIZED_AUTOS': 'YES', 'CLANG_WARN_EMPTY_BODY': 'YES', 'GCC_WARN_ABOUT_RETURN_TYPE': 'YES', 'CLANG_WARN_COMMA': 'YES', 'GCC_WARN_UNUSED_VARIABLE': 'YES', 'CLANG_WARN_RANGE_LOOP_ANALYSIS': 'YES', 'CLANG_ENABLE_MODULES': 'YES', 'GCC_NO_COMMON_BLOCKS': 'YES', 'ENABLE_USER_SCRIPT_SANDBOXING': 'YES', 'CLANG_WARN_INT_CONVERSION': 'YES', 'CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS': 'YES', 'CLANG_WARN_CONSTANT_CONVERSION': 'YES', 'CLANG_WARN_NON_LITERAL_NULL_CONVERSION': 'YES', 'GCC_WARN_UNUSED_FUNCTION': 'YES', 'CLANG_WARN_OBJC_LITERAL_CONVERSION': 'YES', 'CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF': 'YES'}
target_settings = dict(ASSETCATALOG_COMPILER_APPICON_NAME='AppIcon', CODE_SIGN_STYLE='Automatic', CURRENT_PROJECT_VERSION='1', GENERATE_INFOPLIST_FILE='NO', INFOPLIST_FILE='Resources/Info.plist', LD_RUNPATH_SEARCH_PATHS=['$(inherited)', '@executable_path/Frameworks'], MARKETING_VERSION='1.0', PRODUCT_BUNDLE_IDENTIFIER='com.physicstjc.ChargeLab', PRODUCT_NAME='$(TARGET_NAME)', SUPPORTED_PLATFORMS='iphoneos iphonesimulator', SUPPORTS_MACCATALYST='NO', SWIFT_EMIT_LOC_STRINGS='YES', TARGETED_DEVICE_FAMILY='1', ENABLE_PREVIEWS='YES')
project_configs=[]; target_configs=[]
for mode in ['Debug', 'Release']:
    p = dict(project_settings); p['DEBUG_INFORMATION_FORMAT'] = 'dwarf' if mode == 'Debug' else 'dwarf-with-dsym'
    p['SWIFT_OPTIMIZATION_LEVEL'] = '-Onone' if mode == 'Debug' else '-O'
    if mode == 'Debug': p.update(SWIFT_ACTIVE_COMPILATION_CONDITIONS='DEBUG', ENABLE_TESTABILITY='YES', ONLY_ACTIVE_ARCH='YES')
    else: p['SWIFT_COMPILATION_MODE'] = 'wholemodule'
    project_configs.append(add('project-'+mode, 'XCBuildConfiguration', buildSettings=p, name=mode))
    target_configs.append(add('target-'+mode, 'XCBuildConfiguration', buildSettings=target_settings, name=mode))
project_config = add('project-config', 'XCConfigurationList', buildConfigurations=project_configs, defaultConfigurationIsVisible='0', defaultConfigurationName='Release')
target_config = add('target-config', 'XCConfigurationList', buildConfigurations=target_configs, defaultConfigurationIsVisible='0', defaultConfigurationName='Release')
target = add('target', 'PBXNativeTarget', buildConfigurationList=target_config, buildPhases=[source_phase, frameworks, resource_phase], buildRules=[], dependencies=[], name='ChargeLab', productName='ChargeLab', productReference=product, productType='com.apple.product-type.application')
project = add('project', 'PBXProject', attributes={'BuildIndependentTargetsInParallel':'YES','LastSwiftUpdateCheck':'1500','LastUpgradeCheck':'2720','TargetAttributes':{target:{'CreatedOnToolsVersion':'15.0'}}}, buildConfigurationList=project_config, compatibilityVersion='Xcode 14.0', developmentRegion='en', hasScannedForEncodings='0', knownRegions=['en', 'Base'], mainGroup=main, productRefGroup=products, projectDirPath='', projectRoot='', targets=[target])
def encode(value, indent=0):
    if isinstance(value, dict): return '{\n' + ''.join('\t'*(indent+1)+json.dumps(k)+' = '+encode(v,indent+1)+';\n' for k,v in value.items())+'\t'*indent+'}'
    if isinstance(value, list): return '(\n'+''.join('\t'*(indent+1)+encode(v,indent+1)+',\n' for v in value)+'\t'*indent+')'
    return json.dumps(value)
(root/'ChargeLab.xcodeproj/project.pbxproj').write_text('// !$*UTF8*$!\n'+encode(dict(archiveVersion='1',classes={},objectVersion='56',objects=objects,rootObject=project))+'\n')
scheme=f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="1500" version="1.3">
<BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{target}" BuildableName="ChargeLab.app" BlueprintName="ChargeLab" ReferencedContainer="container:ChargeLab.xcodeproj"/></BuildActionEntry></BuildActionEntries></BuildAction>
<TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES"><Testables/></TestAction>
<LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" debugServiceExtension="internal" allowLocationSimulation="YES"><BuildableProductRunnable runnableDebuggingMode="0"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{target}" BuildableName="ChargeLab.app" BlueprintName="ChargeLab" ReferencedContainer="container:ChargeLab.xcodeproj"/></BuildableProductRunnable></LaunchAction>
<ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"><BuildableProductRunnable runnableDebuggingMode="0"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{target}" BuildableName="ChargeLab.app" BlueprintName="ChargeLab" ReferencedContainer="container:ChargeLab.xcodeproj"/></BuildableProductRunnable></ProfileAction>
<AnalyzeAction buildConfiguration="Debug"/><ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/></Scheme>
'''
(root/'ChargeLab.xcodeproj/xcshareddata/xcschemes/ChargeLab.xcscheme').write_text(scheme)
info = dict(CFBundleDevelopmentRegion='$(DEVELOPMENT_LANGUAGE)', CFBundleDisplayName='Charge Lab', CFBundleExecutable='$(EXECUTABLE_NAME)', CFBundleIdentifier='$(PRODUCT_BUNDLE_IDENTIFIER)', CFBundleInfoDictionaryVersion='6.0', CFBundleName='$(PRODUCT_NAME)', CFBundlePackageType='APPL', CFBundleShortVersionString='$(MARKETING_VERSION)', CFBundleVersion='$(CURRENT_PROJECT_VERSION)', LSRequiresIPhoneOS=True, NSCameraUsageDescription='Charge Lab uses the rear camera to detect a table and keep the charge experiment aligned as you move your iPhone. No camera images are recorded or uploaded.', UIRequiredDeviceCapabilities=['arkit'], UILaunchScreen={}, UISupportedInterfaceOrientations=['UIInterfaceOrientationPortrait', 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight'])
(root/'Resources/Info.plist').write_bytes(plistlib.dumps(info))
(root/'Resources/PrivacyInfo.xcprivacy').write_bytes(plistlib.dumps(dict(NSPrivacyTracking=False, NSPrivacyCollectedDataTypes=[], NSPrivacyAccessedAPITypes=[])))
(root/'Resources/Assets.xcassets/Contents.json').write_text(json.dumps({'info':{'author':'xcode','version':1}},indent=2)+'\n')
(root/'Resources/Assets.xcassets/AppIcon.appiconset/Contents.json').write_text(json.dumps({'images':[{'filename':'AppIcon.png','idiom':'universal','platform':'ios','size':'1024x1024'}],'info':{'author':'xcode','version':1}},indent=2)+'\n')
print('Generated ChargeLab.xcodeproj and app metadata.')
