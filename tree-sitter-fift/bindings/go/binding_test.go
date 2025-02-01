package tree_sitter_fift_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_fift "github.com/i582/language-server/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_fift.Language())
	if language == nil {
		t.Errorf("Error loading Fift grammar")
	}
}
