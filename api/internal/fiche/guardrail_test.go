package fiche

import "testing"

func content(params ...Parameter) Content {
	return Content{Stages: []Stage{{Title: "Frittage", Parameters: params}}}
}

func TestGuardrailRejectsUncitedNumericParameter(t *testing.T) {
	c := content(Parameter{Label: "Température", Value: "1530", Unit: "°C", SourceID: ""})
	err := Check(c, map[string]bool{"abc": true})
	if err == nil {
		t.Fatal("expected guardrail to reject an uncited numeric parameter")
	}
}

func TestGuardrailRejectsHallucinatedSource(t *testing.T) {
	c := content(Parameter{Label: "Température", Value: "1530", Unit: "°C", SourceID: "not-supplied"})
	if err := Check(c, map[string]bool{"abc": true}); err == nil {
		t.Fatal("expected guardrail to reject a source_id that was not supplied")
	}
}

func TestGuardrailAcceptsCitedNumericParameter(t *testing.T) {
	c := content(Parameter{Label: "Température", Value: "1530", Unit: "°C", SourceID: "abc"})
	if err := Check(c, map[string]bool{"abc": true}); err != nil {
		t.Fatalf("expected cited numeric parameter to pass, got %v", err)
	}
}

func TestGuardrailAllowsNonNumericWithoutSource(t *testing.T) {
	c := content(Parameter{Label: "Ciment", Value: "auto-adhésif", Unit: "", SourceID: ""})
	if err := Check(c, map[string]bool{}); err != nil {
		t.Fatalf("expected non-numeric parameter to pass without a source, got %v", err)
	}
}
