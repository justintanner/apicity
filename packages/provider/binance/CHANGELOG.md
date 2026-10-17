# @apicity/binance

## Unreleased

### Fixed

- Published `.d.ts` files give every relative import an explicit `.js`
  extension, including the 75 inline `import("./x")` types, so a
  `moduleResolution: node16` or `nodenext` consumer with `skipLibCheck: false`
  no longer gets TS2835 from them (ac-0su9ax).

## 0.3.2

- Initial Binance Spot REST provider with `GET /api/v3/ping`.
