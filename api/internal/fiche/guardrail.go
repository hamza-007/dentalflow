package fiche

import (
	"fmt"
	"regexp"
	"strings"
)

var hasDigit = regexp.MustCompile(`\d`)

// GuardrailError lists every parameter that failed the cite-or-refuse check.
type GuardrailError struct {
	Problems []string
}

func (e *GuardrailError) Error() string {
	return "fiche guardrail rejected: " + strings.Join(e.Problems, "; ")
}

// Check enforces CLAUDE.md §13.3: every NUMERIC parameter value must carry a
// source_id that exists among the chunks supplied to the model; no parameter
// may cite a source_id that was not supplied. Non-numeric values need no source.
func Check(c Content, allowed map[string]bool) error {
	var problems []string

	for _, st := range c.Stages {
		for _, p := range st.Parameters {
			numeric := hasDigit.MatchString(p.Value)

			if numeric && p.SourceID == "" {
				problems = append(problems,
					fmt.Sprintf("stage %q · %q = %q has no source_id", st.Title, p.Label, p.Value))
				continue
			}
			if p.SourceID != "" && !allowed[p.SourceID] {
				problems = append(problems,
					fmt.Sprintf("stage %q · %q cites unknown source_id %q", st.Title, p.Label, p.SourceID))
			}
		}
	}

	if len(problems) > 0 {
		return &GuardrailError{Problems: problems}
	}
	return nil
}
