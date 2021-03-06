Object.extend({
    
    resolvePath: function (pathstring) {
        var path = window,
            objectpath = pathstring.split('.');
    
        for (var i=0, l = objectpath.length; i < l; i++) {
            var pathpart = objectpath[i];
            if (!pathpart in path) return;
            path = path[pathpart];
        }
        
        return path;
    },
    
    can: function (object, methodname) {
        try {
            var method = object[methodname];
            if (method && typeOf(method) == 'function') return true;
        // that means we have null or undefined or anything that cannot be
        // operated on with the . operator, so the object has no method
        } catch (err) {} 
        return false;
    }

});

String.implement('box', function () {
    return instanceOf(this, Object) ? this : new String(this);
});

Boolean.implement('box', function () {
    return instanceOf(this, Object) ? this : new Boolean(this);
});

Number.implement('box', function () {
    return instanceOf(this, Object) ? this : new Number(this);
});


(function () {

var $empty = function () {},
    findClassType = function (typename) {
        var foundObject = Object.resolvePath(typename),
            typeofpath = typeOf(foundObject);
            
        if (typeofpath == 'type' || typeofpath == 'class' || foundObject === Object) {
            return foundObject;
        }
    };

var Attribute = Class.Attribute = new Class({

    Implements: Options,

    _allowed_values_for_is: { ro: true, rw: true, bare: true },
    _allowed_simple_default_types: new Hash({
        'string'    : true,
        'number'    : true,
        'boolean'   : true,
        'regexp'    : true,
        'undefined' : true,
        'null'      : true
    }),

    // allowedTypes: {}
    // allowedClassTypes : {}
    // handles: {}
    // requiredMethods: []

    options: {
        // name
        // membername
        // gettername
        // settername
        is:             'bare',
        //isa:  type
        required:       false,
        lazy:           false
        //default:
        //builder
        //documentation:  '',
        //reader
        //writer
        //predicate
        //clearer
        //initArg
    },

    // API /////////////////////////////////////////////////////////////////////
    getMembername:      function () { return this.options.membername;   },
    getGettername:      function () { return this.options.gettername;   },
    getSettername:      function () { return this.options.settername;   },
    getName:            function () { return this.options.name;         },
    getIs:              function () { return this.options.is;           },
    getIsa:             function () { return this.options.isa;          },
    isRequired:         function () { return this.options.required;     },
    isLazy:             function () { return this.options.lazy;         },
    getDefault:         function () { return this.options['default'];   },
    getBuilder:         function () { return this.options.builder;      },
    getDocumentation:   function () { return this.options.documentation;},
    getReader:          function () { return this.options.reader;       },
    getWriter:          function () { return this.options.writer;       },
    getPredicate:       function () { return this.options.predicate;    },
    getClearer:         function () { return this.options.clearer;      },
    getHandles:         function () { return this.options.handles;      },
    getInitArg:         function () { return this.options.initArg;      },
    getAllowedTypes:    function () {
        if (!this.allowedTypes) { this._parseTypes(); }
        return this.allowedTypes;
    },
    getAllowedClassTypes: function () {
        if (!this.allowedClassTypes) { this._parseTypes(); }
        return this.allowedClassTypes;
    },

    _parseTypes: function () {
        var allowedtypes        = this.allowedTypes         = {};
        var allowedClassTypes   = this.allowedClassTypes    = [];

        if (!this.options.isa) { return; }

        this.options.isa.split(/\|/).each(function (typename) {
            // in IE8 Elements are extended differently
            // causing instanceOf not to match, although typeOf works
            if (Browser.ie && typename == 'Element') {
                allowedtypes[typename.toLowerCase()] = true;
                return;
            }

            var classType = findClassType(typename);
            if (classType) {
                allowedClassTypes.push(classType);
            } else {
                allowedtypes[typename.toLowerCase()] = true;
            }
        });
    },

    // Startup /////////////////////////////////////////////////////////////////
    initialize: function (name, definition, klass) {
        this.setOptions(definition);
        this.options.name = name;

        this._sanitizeOptions();
        this._build();
        this._performChecks();
        this._applyTo(klass);
    },

    // applies state to class
    _applyTo: function (klass) {
        var opts = this.options;

        if (this.hasReadingAccessor) {
            klass.implement(opts.gettername, this.generateReadingAccessor());
        }

        if (this.hasWritingAccessor) {
            klass.implement(opts.settername, this.generateWritingAccessor());
        }

        if (this.hasExplicitReader) {
            klass.implement(opts.reader,  this.generateReadingAccessor());
        }

        if (this.hasExplicitWriter) {
            klass.implement(opts.writer, this.generateWritingAccessor());
        }

        if (this.hasPredicate) {
            klass.implement(opts.predicate, this.generatePredicate());
        }

        if (this.hasClearer) {
            klass.implement(opts.clearer, this.generateClearer());
        }

        if (this.hasHandles) {
            Object.each(this.options.handles, function (delegatename, methodname) {
                klass.implement(
                    methodname,
                    this.generateHandle(delegatename, methodname)
                );
            }, this);
        }
    },

    // defines state
    _build: function () {
        var opts = this.options;
        opts.has = opts.hasOwnProperty;

        this.hasReadingAccessor = (opts.is == 'rw' || opts.is == 'ro');
        this.hasWritingAccessor = (opts.is == 'rw');

        this.hasDefault         = opts.has('default');
        this.hasBuilder         = opts.has('builder');
        this.hasInit            = opts.has('default') ||
                                  opts.has('builder');

        this.hasExplicitReader  = opts.has('reader');
        this.hasExplicitWriter  = opts.has('writer');

        this.hasPredicate       = opts.has('predicate');
        this.hasClearer         = opts.has('clearer');

        this.hasIsa             = opts.has('isa');
        this.hasDoes            = opts.has('does');

        this.hasHandles         = opts.has('handles');

        delete opts.has;
    },

    // sets defaults for accessordefinition
    _sanitizeOptions: function () {
        var opts = this.options;

        var name        = opts.name;
        opts.membername = this._toMemberName(name);
        opts.gettername = this._toGetterName(name);
        opts.settername = this._toSetterName(name);

        /* lazy builder same as
            builder   => '_buildSize',
            clearer   => 'clearSize',
            predicate => 'hasSize' */
        if (opts.lazy_build || opts.lazyBuild) {
            var ucname = name.capitalize();
            opts.lazy       = true;
            opts.clearer    = 'clear'   + ucname;
            opts.predicate  = 'has'     + ucname;
            opts.builder    = '_build'  + ucname;
        }

        // is may only have allowed values
        if (!this._allowed_values_for_is[opts.is]) opts.is = 'bare';

        // handles may be an array => transform to object
        if (opts.handles && instanceOf(opts.handles, Array)) {
            var handles     = opts.handles;
            opts.handles    = {};
            handles.each(function (name) { opts.handles[name] = name; });
        }
        
        // TODO: API Access
        // TODO: Lazy Behaviour of API
        if (opts.does) {
            var requiredMethods = this.requiredMethods = [];
            Array.from(opts.does).each(function (classname) {
                var object = Object.resolvePath(classname);
                if (!object) return;
                if (typeOf(object) != 'class') return;
                Object.each(object.prototype, function (method, methodname) {
                    if (methodname.charAt(0) == '$')    return; // internal method
                    if (typeOf(method) != 'function')   return; // only methods required
                    if (methodname == 'parent')         return; // internal
                    requiredMethods.push(methodname);                
                });
            });
        }
        
        // initArg has the accessors name as default
        // might be undefined for args without initArg
        if (!opts.hasOwnProperty('initArg')) opts.initArg = opts.name;
    },

    // performs compile time checks
    _performChecks: function () {
        var opts        = this.options,
            name        = opts.name,
            gettername  = opts.gettername,
            settername  = opts.settername;

        // only default OR builder is allowed
        if (opts.hasOwnProperty('default') && opts.hasOwnProperty('builder')) {
            throw new Error(
                'Only either builder or default is allowed. '+
                'Accessor: "' + name + '"'
            );
        }

        // simple defaults are only allowed for certain types
        if (opts.hasOwnProperty('default')) {
            var allowedtypes    = this._allowed_simple_default_types,
                typeDefault     = typeOf(opts['default']);

            if (typeDefault != 'function' && !allowedtypes.get( typeDefault )) {
                throw new Error(
                    'Simple values as a default are only allowed for types ' +
                    '"' + allowedtypes.getKeys().join('", "') + '". ' +
                    'Please wrap your value with an anonymous function. ' +
                    'Accessor: "' + name + '"'
                );
            }
        }

        // reader or writer is not allowed to have the same name as the attribute
        if (opts.hasOwnProperty('reader')) {
            if (opts.reader == gettername && this.hasReadingAccessor ||
                opts.reader == settername && this.hasWritingAccessor)
            {
                throw new Error(
                    'Setting reader to the same as the accessorname does not ' +
                    'make sense. Accessor: "'+ name +'"'
                );
            }
        }

        if (opts.hasOwnProperty('writer')) {
            if (opts.writer == gettername && this.hasReadingAccessor ||
                opts.writer == settername && this.hasWritingAccessor) {
                throw new Error(
                    'Setting writer to the same as the accessorname does not ' +
                    'make sense. Accessor: "'+ name +'"'
                );
            }
        }

        if (opts.hasOwnProperty('writer') && opts.hasOwnProperty('reader') &&
            opts.reader == opts.writer)
        {
            throw new Error(
                'Setting writer to the same as the reader does not ' +
                'make sense. Accessor: "'+ name +'"'
            );
        }


    },

    // API for handling attributes /////////////////////////////////////////////
    // apply only myself, but all parameters are passed to check definedness
    applyConstructor: function (instance, parameters) {
        var opts        = this.options,
            name        = opts.name,
            initArg     = opts.initArg,
            membername  = opts.membername;

        // default / builder
        if (initArg !== undefined && parameters.hasOwnProperty(initArg)) {
            var value = parameters[initArg];
            this.generateWritingConstructor().call(instance, value);
        } else if (this.hasInit) {
            var initValue = this.generateInitValue().apply(instance);
            this.generateWritingConstructor().call(instance, initValue);
        }

        // required / after value should have been set
        if (opts.required && !instance.hasOwnProperty(membername)) {
            throw new Error(
                'Accessor is required, but was not set via constructor, ' +
                'default or builder. Accessor: "'+ name +'".'
            );
        }
    },

    // methodGenerators ////////////////////////////////////////////////////////
    // is
    generateReadingAccessor: function () {
        if (!this._readingAccessor) {
            var membername = this.getMembername();
            this._readingAccessor = function () { return this[membername]; };
        }
        return this._readingAccessor;
    },

    generateWritingConstructor: function () {
        if (!this._writingConstructor) {
            var membername  = this.getMembername(),
                trigger     = this.generateTrigger(),
                typecheck   = this.generateTypecheck(),
                doescheck   = this.generateDoesCheck();


            this._writingConstructor = function (value) {
                typecheck(value);
                doescheck(value);

                var old         = this[membername],
                    setbefore   = this.hasOwnProperty(membername);

                this[membername] = value;
                trigger.apply(this, [value, old, setbefore]);
                return this;
            };
        }

        return this._writingConstructor;
    },

    // check for codeduplication
    generateWritingAccessor: function () {
        if (!this._writingAccessor) {
            var membername  = this.getMembername(),
                trigger     = this.generateTrigger(),
                typecheck   = this.generateTypecheck(),
                doescheck   = this.generateDoesCheck();

            this._writingAccessor = function (value) {
                typecheck(value);
                doescheck(value);

                var old         = this[membername],
                    setbefore   = this.hasOwnProperty(membername);

                this[membername] = value;
                trigger.apply(this, [value, old, setbefore]);
                return this;
            };
        }

        return this._writingAccessor;
    },

    generateInitValue: function () {
        if (!this._initvalue) {
            if (this.hasBuilder) {
                var methodname = this.options.builder;
                this._initvalue = new Function('return this.' + methodname + '();');
            } else if (this.hasDefault) {
                var defaultvalue = this.options['default'];

                if (this._allowed_simple_default_types.get(typeOf(defaultvalue))) {
                    // immutable Objecttypes may be passed directly
                    this._initvalue = function () { return defaultvalue; };
                } else {
                    // mutable Objecttypes must be already wrapped in a function
                    // check was already performed during compiletime
                    this._initvalue = defaultvalue;
                }
            }
        }
        return this._initvalue;
    },

    generateClearer: function () {
        if (!this._clearer) {
            var membername = this.getMembername(),
                trigger    = this.generateTrigger();

            this._clearer = function () {
                var old         = this[membername],
                    setbefore   = this.hasOwnProperty(membername);

                delete this[membername];
                trigger.apply(this, [undefined, old, setbefore]);
            };
        }

        return this._clearer;
    },

    generatePredicate: function () {
        if (!this._predicate) {
            var membername = this.getMembername();
            this._predicate = function () {
                return this.hasOwnProperty(membername);
            }
        }

        return this._predicate;
    },

    generateTrigger: function () {
        if (!this._trigger) {
            var opts        = this.options,
                membername  = opts.membername,
                triggername = 'change:' + opts.name;

            this._trigger = function (newvalue, oldvalue, setbefore) {
                if (newvalue == oldvalue) return; // not changed
                this.fireEvent(triggername, [ oldvalue, newvalue, setbefore ]);
            }
        }

        return this._trigger;
    },

    generateTypecheck: function () {
        if (!this._typecheck) {
            // no isa for attribute
            if (!this.hasIsa) return this._typecheck = $empty;

            var opts                = this.options,
                isa                 = opts.isa,
                name                = opts.name,
                allowedtypes        = this.getAllowedTypes(),
                allowedClassTypes   = this.getAllowedClassTypes();

            this._typecheck = function (value) {
                // classtypechecks make no sense for undefined/null
                if (value !== undefined && value !== null) {
                    if (Object.can(value, 'box'))  { value = value.box() }
                    
                    // classtypecheck
                    var isInstance = allowedClassTypes.some(function (classType) {
                        return instanceOf(value, classType);
                    });
                    if (isInstance)  return;    
                }

                // typecheck
                var checktype;
                if (value === undefined)    checktype = "undefined";
                else if (value === null)    checktype = "null";
                else                        checktype = typeOf(value);

                if (!allowedtypes[checktype]) throw new Error(
                    'Type constraint ' + name + ' may only be ' + isa +
                    ', but a Type ' + checktype + ' (' + value + ') was set.'
                );
            };
        }

        return this._typecheck;
    },

    generateHandle: function (delegatename, methodname) {
        var handles = (this.handles = this.handles || {});

        // TODO existing methods collissions
        if (!handles[methodname]) {
            var reader          = this.generateReadingAccessor();

            handles[methodname] = function () {
                var value = reader.apply(this);
                return value[delegatename].apply(value, arguments);
            };
        }

        return handles[methodname];
    },

    generateDoesCheck: function () {
        if (!this._doescheck) {
            if (!this.hasDoes) return this._doescheck = $empty;
            
            var requiredMethods     = this.requiredMethods,
                name                = this.options.name;

            this._doescheck = function (value) {
                if (value === undefined || value === null) {
                    throw new Error (
                        'Doescheck fails for Attribute ' + name + '. ' +
                        'Value is Undefined or Null.'
                    );
                }
                
                if (Object.can(value, 'box'))  { value = value.box() }
                
                for (var i=0, l = requiredMethods.length; i < l; i++) {
                    var methodname = requiredMethods[i];
                    if (typeOf(value[methodname]) != 'function' ||
                        value[methodname].$required ||
                        value[methodname].$origin && value[methodname].$origin.$required
                    ) {
                        throw new Error (
                            'Doescheck fails for Attribute ' + name + '. ' +
                            'Object "' + value + '" does not implement a ' +
                            'method ' + methodname + '.'
                        );
                    }
                }
            };
        }

        return this._doescheck;
    },

    // utils ///////////////////////////////////////////////////////////////////
    _toMemberName: function (name) { return '___' + name + '___'; },
    _toGetterName: function (name) { return this._generateName('get', name) },
    _toSetterName: function (name) { return this._generateName('set', name) },
    _generateName: function (action, name) {
        // usually regexes are slower, though not benchmarked here :(
        // first char is NOT a _ => usual namegeneration
        if (name.indexOf('_') != 0) return action + name.capitalize();
        // else we prepend the accessors' name with _ and cut it from its real name
        // name: _test => gettername: _getTest (instead of get_test)
        return '_' + action + name.substring(1).capitalize()
    }

});

})();