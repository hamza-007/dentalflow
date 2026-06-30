package fiche

import (
	"strings"

	"dentalflow/api/internal/cases"
	"dentalflow/api/internal/kb"
)

// stageDef maps a KB parameter_type to a fabrication stage (title + order).
type stageDef struct {
	ptype string
	title string
}

// Ordered fabrication stages (French). Chunks are slotted into these by their
// parameter_type; unknown types fall into a trailing "Autres paramètres" stage.
var stageOrder = []stageDef{
	{"reception", "Réception"},
	{"conception", "Conception (CAO)"},
	{"usinage", "Usinage"},
	{"pressing", "Pressée"},
	{"sintering", "Frittage"},
	{"firing", "Cuisson"},
	{"glaze", "Maquillage / Glaçage"},
	{"cement", "Collage"},
	{"finition", "Finition / Polissage"},
}

const disclaimer = "Aide à la décision et à la documentation. Le prothésiste reste responsable. " +
	"Fiche assemblée automatiquement à partir de la base de connaissances ; vérifier l'IFU du fabricant."

// assemble deterministically builds a fiche Content from a case and the KB
// chunks retrieved for its material. Every parameter is the verbatim sourced
// text with its source_id — no value is ever invented (CLAUDE.md §13.3).
func assemble(c cases.Case, chunks []kb.RetrievedChunk) Content {
	shade := ""
	if c.Shade != nil {
		shade = *c.Shade
	}

	// Group chunks by normalized parameter_type.
	byType := map[string][]kb.RetrievedChunk{}
	for _, ch := range chunks {
		key := strings.ToLower(strings.TrimSpace(ch.ParameterType))
		byType[key] = append(byType[key], ch)
	}

	known := map[string]bool{}
	stages := make([]Stage, 0)
	order := 1

	addStage := func(title string, group []kb.RetrievedChunk) {
		params := make([]Parameter, 0, len(group))
		for _, ch := range group {
			params = append(params, Parameter{
				Label:    title,
				Value:    ch.Content, // verbatim sourced text
				Unit:     "",
				SourceID: ch.SourceID,
			})
		}
		stages = append(stages, Stage{Order: order, Title: title, Parameters: params})
		order++
	}

	for _, sd := range stageOrder {
		if group, ok := byType[sd.ptype]; ok && len(group) > 0 {
			known[sd.ptype] = true
			addStage(sd.title, group)
		}
	}

	// Any parameter_type not in the standard sequence.
	var others []kb.RetrievedChunk
	for key, group := range byType {
		if !known[key] {
			others = append(others, group...)
		}
	}
	if len(others) > 0 {
		addStage("Autres paramètres", others)
	}

	missing := make([]string, 0)
	if len(chunks) == 0 {
		missing = append(missing,
			"Aucune donnée de fabrication dans la base pour ce matériau — consulter l'IFU du fabricant.")
	}

	return Content{
		CaseSummary: CaseSummary{
			Type:     c.ProsthesisType,
			Material: c.Material,
			Shade:    shade,
			Teeth:    c.Teeth,
		},
		Materials: []string{c.Material},
		Equipment: []string{},
		Stages:    stages,
		QCChecklist: []string{
			"Ajustage sur le modèle",
			"Points de contact proximaux",
			"Occlusion",
			"Teinte",
			"État de surface / polissage",
		},
		Cautions:    []string{},
		MissingData: missing,
		Disclaimer:  disclaimer,
	}
}
