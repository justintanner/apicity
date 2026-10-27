# Legacy image fixtures

The previous `cat1.jpg`, `cat2.jpg` and `man.jpg`. They are kept only because
some committed recordings replay against these exact bytes. New tests use
`tests/fixtures/cat1.jpg` and `tests/fixtures/man.jpg`. When you re-record a
test that reads from this folder, point it back at `tests/fixtures/`.
