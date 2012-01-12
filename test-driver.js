(function () {
  "use strict";

  /*
    Cases that need testing:
    
    a new file is added // most common
    a symlink to a new file is added
    a symlink to an existing file is added
    an existing (md5 match) file is added
  */

  var fs = require('fs')
    , path = require('path')
    , Copy = require('./copy-strategy')
    , Meta = require('./meta-strategy')
    ;

  function create(options) {
    var copy = Copy.create()
      , metaStore = Meta.create()
      ;

    function handleFile(_givenpath) {
      var givenpath
        , metapath
        ;

      function gotErDone(e, stat) {
        if (e) {
          console.error('[gotErDone Error]');
          console.error(e);
          return;
        }
        console.log('finished for', '\n  ' + givenpath, '\n  ' + stat.md5sum, '\n  ' + stat.stathash);
        //console.log(stat);
      }

      function saveMeta(e, fileStats) {
        if (e) {
          gotErDone(e, fileStats);
        }

        metaStore(function (e, _metapath) {
          metapath = _metapath;
          gotErDone(e, fileStats);
        }, givenpath, fileStats);
      }

      function getStats(e, fileStats) {
        if (e) {
          console.error('[getStat ERROR] cannot stat ' + givenpath, e.message);
          console.error(e.stack);
          return;
        }
        
        // is this right?
        //fileStats.pathname = givenpath;
        fileStats.filepath = givenpath;
        fileStats.path = givenpath.substr(0, givenpath.lastIndexOf('/'));
        fileStats.name = givenpath.substr(givenpath.lastIndexOf('/') + 1);
        //copyAndChecksum();

        fs.realpath(path.resolve(process.cwd(), givenpath), function (err, realpath) {
          fileStats.realpath = realpath.substr(0, realpath.lastIndexOf('/'));
          fileStats.realname = realpath.substr(realpath.lastIndexOf('/') + 1);
          copy(saveMeta, givenpath, fileStats);
        });
      }

      givenpath = _givenpath;
      fs.lstat(givenpath, getStats);
    }

    return handleFile;
  }

  // TODO move givenpath to fileStats.xyz
  var handleFile = create();
  handleFile('./testroot/absolute/real');
  //handleFile('./testroot/absolute/goodbye.txt');
  ////handleFile('./testroot/symbolic/broken');
  //handleFile('./testroot/symbolic/link-to-a-link');
  ////handleFile('./testroot/symbolic/out-of-scope');
  handleFile('./testroot/symbolic/working');
}());
