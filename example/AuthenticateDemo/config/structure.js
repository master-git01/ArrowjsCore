module.exports = {
    modules: {
        "path": {
            "folder": "/modules",
            "file": "module.js"
        },
        //extends : {
        //  system :true
        //},
        //model : {
        //    path: {
        //        folder : "models",
        //        file: "*.js"
        //    }
        //},
        controller: {
            path: {
                folder : "controllers",
                file: "*.js"
            }
        },
        view : {
          path : {
              folder: "views"
          }
        },
        route : {
            path : {
                file :'route.js'
            }
        }
    }
};
