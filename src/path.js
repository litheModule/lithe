var getTimeStamp = function(url) {
  var query = url.slice(url.lastIndexOf('?') + 1).split('&');
  for (var i = 0; i < query.length; i++) {
    var item = query[i].split('='),
      key = item[0],
      val = item[1];
    if (key === 'timestamp') {
      return val;
    }
  }
  return null;
};

var isAbsolute = function(url) {
  return url.indexOf('://') > 0 || url.indexOf('//') === 0;
};


var dirname = function(url) {
  var s = url.match(/[^?]*(?=\/.*$)/);
  return (s ? s[0] : '.') + '/';
};

var filename = function(url) {
  return url.slice(url.lastIndexOf('/') + 1).replace(/\?.*$/, '');
};

var isDir = function(url) {
  return !filename(url);
};

var realpath = function(path) {
  var multiple_slash_re = /([^:\/])\/\/+/g;
  multiple_slash_re.lastIndex = 0;
  if (multiple_slash_re.test(path)) {
    path = path.replace(multiple_slash_re, '$1\/');
  }
  if (path.indexOf('.') === -1) {
    return path;
  }
  var original = path.split('/'),
    ret = [],
    part;
  for (var i = 0; i < original.length; i++) {
    part = original[i];
    if (part === '..') {
      if (ret.length === 0) {
        throw new Error('The path is invalid: ' + path);
      }
      ret.pop();
    } else if (part !== '.') {
      ret.push(part);
    }
  }
  return ret.join('/');
};

var normalize = function(url, t) {
  url = realpath(url);
  var lastChar = url.charAt(url.length - 1);
  if (lastChar === '/') {
    return url;
  }
  if (lastChar === '#') {
    url = url.slice(0, -1);
  } else if (url.indexOf('?') === -1 && !(/\.(?:js|css)$/).test(url)) {
    url += '.js';
  }
  if (url.indexOf(':80/') > 0) {
    url = url.replace(':80/', '/');
  }
  if (t) {
    url = url.replace(/\?.+$/, '');
  }
  return url;
};

var replaceDir = function(id) {
  //只替换一次,且如果路径包含2个dir，也只替换一次,并且只匹配第一个，之后的不匹配
  // UI:../ -> UI/test = ../test
  // UI:../ -> UI/UI/test = ../UI/test
  // UI:../ -> ../a/UI/test = ../a/UI/test [不会替换]
  // UI:../ -> a/UI/test = a/UI/test [不会替换]
  var locks = {},
    k, path, reg, dir, j;
  for (k = 0; k < directorys.length; k++) {
    if (locks[id]) {
      break;
    }
    dir = directorys[k];
    for (j in dir) {
      path = dir[j];
      reg = new RegExp("^" + j + "\/");
      if (reg.test(id) && !locks[id]) {
        id = id.replace(reg, path);
        locks[id] = true;
        break;
      }
    }
  }
  return id;
};

var replaceId = function(id) {
  var alias = config.alias;
  if (alias) {
    var newid = alias[id];
    return newid ? newid : replaceDir(id);
  }
  return id;
};

var resolve = function(id, path) {
  // 改动,处理public依赖的路径

  if (lithe && lithe.publicpath && isPublicDeps(id).isPublicDeps) {
    path = lithe.publicpath;
  } else {
    path = dirname(path || lithe.basepath);
  }

  if (isAbsolute(id)) {
    return id;
  }
  if (isInitConfig) {
    id = replaceId(id);
  }
  var url = '';
  if (id.indexOf('./') === 0 || id.indexOf('../') === 0) {
    if (id.indexOf('./') === 0) {
      id = id.substring(2);
    }
    url = path + id;
  } else if (id.charAt(0) === '/' && id.charAt(1) !== '/') {
    url = path + id.substring(1);
  } else {
    url = path + '/' + id;
  }
  return normalize(url);
};
