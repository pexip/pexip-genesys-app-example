module.exports = function override (config, env) {
  const loaders = config.resolve
  loaders.fallback = {
    assert: false,
    fs: false,
    http: false,
    https: false,
    os: false,
    path: false,
    stream: false,
    url: false,
    util: false,
    zlib: false
  }
  return config
}
