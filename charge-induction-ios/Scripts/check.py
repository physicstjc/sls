#!/usr/bin/env python3
"""Validate project metadata and execute the actual physics test methods.
The small assert adapter permits testing with Command Line Tools without XCTest.
The original tests remain runnable with `swift test` when full Xcode is installed.
"""
import pathlib, re, subprocess, tempfile, json, xml.etree.ElementTree as ET
root = pathlib.Path(__file__).resolve().parents[1]
for path in [root/'ChargeLab.xcodeproj/project.pbxproj',root/'Resources/Info.plist',root/'Resources/PrivacyInfo.xcprivacy']:
    subprocess.run(['plutil','-lint',str(path)],check=True)
ET.parse(root/'ChargeLab.xcodeproj/xcshareddata/xcschemes/ChargeLab.xcscheme')
for path in (root/'Resources').rglob('*.json'): json.loads(path.read_text())
sources = sorted((root/'Sources/ChargeLab').glob('*.swift'))+[root/'Sources/ChargePhysics/ChargePhysics.swift']
subprocess.run(['swiftc','-frontend','-parse',*[str(p) for p in sources]],check=True)
test_source=(root/'Tests/ChargePhysicsTests/ChargePhysicsTests.swift').read_text()
test_source=test_source.replace('import XCTest','import Foundation').replace('@testable import ChargePhysics','')
methods=re.findall(r'func (test\w+)\(\)',test_source)
assert len(methods) == 11, 'Update the portable runner if the suite changes'
adapter='''
class XCTestCase {}
func XCTAssertEqual<T: Equatable>(_ a: T, _ b: T) { precondition(a == b, "Expected equality: \\(a) vs \\(b)") }
func XCTAssertEqual(_ a: Float, _ b: Float, accuracy: Float) { precondition(abs(a-b) <= accuracy, "Expected approximate equality: \\(a) vs \\(b)") }
func XCTAssertTrue(_ value: Bool) { precondition(value) }
func XCTAssertFalse(_ value: Bool) { precondition(!value) }
func XCTAssertGreaterThan<T: Comparable>(_ a: T, _ b: T) { precondition(a > b) }
func XCTAssertGreaterThanOrEqual<T: Comparable>(_ a: T, _ b: T) { precondition(a >= b) }
func XCTAssertLessThanOrEqual<T: Comparable>(_ a: T, _ b: T) { precondition(a <= b) }
'''
with tempfile.TemporaryDirectory(prefix='charge-ios-check-') as tmp:
    tmp=pathlib.Path(tmp)
    (tmp/'Checks.swift').write_text(adapter+'\n'+test_source)
    (tmp/'main.swift').write_text('let suite = ChargePhysicsTests()\n'+'\n'.join('suite.'+name+'(); print("PASS '+name+'")' for name in methods))
    subprocess.run(['swiftc','-module-cache-path',str(tmp/'ModuleCache'),str(root/'Sources/ChargePhysics/ChargePhysics.swift'),str(tmp/'Checks.swift'),str(tmp/'main.swift'),'-o',str(tmp/'checks')],check=True)
    subprocess.run([str(tmp/'checks')],check=True)
print('Project metadata, Swift syntax, and 11 executable physics checks passed. iOS SDK compilation and device AR are not checked here.')
