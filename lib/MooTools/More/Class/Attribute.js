(function () {
    
var $empty = function () {};    
    
var Attribute = Class.Attribute = new Class({

    Implements: Options,
    
    _allowed_values_for_is: { ro: true, rw: true, bare: true },
    
    // allowedTypes: {}
    
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
    getAllowedTypes:    function () {
        if (!this.allowedTypes) {
            var allowedtypes = this.allowedTypes = {};
            this.options.isa.split(/\|/).each(function (typename) {
                allowedtypes[typename] = true;
            });
        }
        
        return this.allowedTypes;
    },

    // Startup /////////////////////////////////////////////////////////////////
    initialize: function (name, definition, klass) {
        this.setOptions(definition);
        this.options.name = name;
        
        this._sanitizeOptions();
        this._build();
        this._applyTo(klass);
    },
  
    // applies state to class
    _applyTo: function (klass) {
        var opts = this.options;
        
        if (this.hasReadingAccessor) {
            klass.implement(opts.getterName, this.generateReadingAccessor());
        }
        
        if (this.hasWritingAccessor) {
            klass.implement(opts.setterName, this.generateWritingAccessor());
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
        
        delete opts.has;
    },
  
    // sets defaults for accessordefinition
    _sanitizeOptions: function () {
        var opts = this.options;
        
        var name        = opts.name;
        opts.membername = this._toMemberName(name);
        opts.getterName = this._toGetterName(name);
        opts.setterName = this._toSetterName(name);
        
        // is may only have allowed values
        if (!this._allowed_values_for_is[opts.is]) opts.is = 'bare';
        
        // only default OR builder is allowed
        if (opts.hasOwnProperty('default') && opts.hasOwnProperty('builder')) {
            throw new Error(
                'Only either builder or default is allowed. '+
                'Accessor: "' + name + '"'
            );
        }
    },
    
    
    // API for handling attributes /////////////////////////////////////////////
    // apply only myself, but all parameters are passed to check definedness
    applyConstructor: function (instance, parameters) {
        var opts        = this.options,
            name        = opts.name,
            membername  = this.getMembername(),
            value       = parameters[name];
            
        // default / builder
        if (parameters.hasOwnProperty(name)) {
            this.generateWritingConstructor().apply(instance, [value]);
        } else if (this.hasInit) {
            var initValue = this.generateInitValue().apply(instance);
            this.generateWritingConstructor().apply(instance, [initValue]);
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
                typecheck   = this.generateTypecheck();
                
            this._writingConstructor = function (value) {
                typecheck(value);

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
                typecheck   = this.generateTypecheck();
            
            this._writingAccessor = function (value) {
                typecheck(value);

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
                this._initvalue = function () { return defaultvalue; };
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
            var membername  = this.getMembername(),
                triggername = 'change:' + this.getName();
            
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
            
            var isa             = this.getIsa(),
                name            = this.getName(),
                allowedtypes    = this.getAllowedTypes();
                        
            return function (value) {
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
  
    // utils ///////////////////////////////////////////////////////////////////
    _toMemberName: function (name) { return '___' + name + '___'; },
    _toGetterName: function (name) { return 'get' + name.capitalize(); },
    _toSetterName: function (name) { return 'set' + name.capitalize(); }

});

})();