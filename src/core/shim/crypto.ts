const getRandomValues = (byteArray: Uint32Array) => {
  const result = TL_CRDT_Native.crypto.getRandomValues(byteArray);

  if (result) {
    return result;
  }

  for (let i = 0; i < byteArray.length; i++) {
    byteArray[i] = Math.floor(256 * Math.random());
  }
  return byteArray;
};

const glo =
  /** @type {any} */
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : {};
// @ts-expect-error 模拟 crypto
if (!glo.crypto) {
  // @ts-expect-error 模拟 crypto
  glo.crypto = {};
}
// @ts-expect-error 模拟 crypto
glo.crypto.getRandomValues = glo.crypto.getRandomValues || getRandomValues;
