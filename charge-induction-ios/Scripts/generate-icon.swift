import Foundation
import CoreGraphics
import ImageIO

let side = 1024
let context = CGContext(data: nil, width: side, height: side, bitsPerComponent: 8, bytesPerRow: side * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
context.setFillColor(CGColor(red: 0.025, green: 0.48, blue: 0.53, alpha: 1))
context.fill(CGRect(x: 0, y: 0, width: 1024, height: 1024))
context.setFillColor(CGColor(gray: 0.90, alpha: 1))
context.fillEllipse(in: CGRect(x: 150, y: 140, width: 440, height: 90))
context.fill(CGRect(x: 335, y: 200, width: 65, height: 190))
context.setFillColor(CGColor(red: 0.78, green: 0.90, blue: 0.94, alpha: 1))
context.fillEllipse(in: CGRect(x: 135, y: 350, width: 470, height: 470))
context.setFillColor(CGColor(red: 0.10, green: 0.22, blue: 0.39, alpha: 1))
context.addPath(CGPath(roundedRect: CGRect(x: 665, y: 450, width: 145, height: 390), cornerWidth: 65, cornerHeight: 65, transform: nil)); context.fillPath()
func sign(_ x: CGFloat, _ y: CGFloat, plus: Bool) {
    context.setFillColor(CGColor(gray: 1, alpha: 1)); context.fillEllipse(in: CGRect(x: x - 38, y: y - 38, width: 76, height: 76))
    context.setStrokeColor(plus ? CGColor(red: 0.82, green: 0.22, blue: 0.19, alpha: 1) : CGColor(red: 0.12, green: 0.38, blue: 0.83, alpha: 1))
    context.setLineWidth(9); context.setLineCap(.round); context.move(to: CGPoint(x: x - 17, y: y)); context.addLine(to: CGPoint(x: x + 17, y: y)); context.strokePath()
    if plus { context.move(to: CGPoint(x: x, y: y - 17)); context.addLine(to: CGPoint(x: x, y: y + 17)); context.strokePath() }
}
for point in [CGPoint(x: 230, y: 530), CGPoint(x: 250, y: 660), CGPoint(x: 360, y: 740)] { sign(point.x, point.y, plus: true) }
for point in [CGPoint(x: 460, y: 520), CGPoint(x: 490, y: 640), CGPoint(x: 735, y: 560), CGPoint(x: 735, y: 720)] { sign(point.x, point.y, plus: false) }
let destinationURL = URL(fileURLWithPath: CommandLine.arguments[1])
let destination = CGImageDestinationCreateWithURL(destinationURL as CFURL, "public.png" as CFString, 1, nil)!
CGImageDestinationAddImage(destination, context.makeImage()!, nil)
guard CGImageDestinationFinalize(destination) else { fatalError("Could not write app icon") }
