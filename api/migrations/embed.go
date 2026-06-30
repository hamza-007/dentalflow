// Package migrations embeds the SQL migration files so the server can run them
// on boot without depending on the working directory.
package migrations

import "embed"

// FS holds the embedded *.sql migration files (golang-migrate iofs source).
//
//go:embed *.sql
var FS embed.FS
