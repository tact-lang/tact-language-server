import XCTest
import SwiftTreeSitter
import TreeSitterTact

final class TreeSitterTactTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_tact())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Tact grammar")
    }
}
