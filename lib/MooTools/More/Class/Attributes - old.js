(function () {

/*******************************************************************************
 * TODO
 *******************************************************************************
 * delegates
 *
 * traits
 *
 * + sign
 *
 * nested types
 *
 * Events-Kompatibilität / different class
 *
 * coercion ?
 *
 * inheritance
 *
 * alternate naming / different class
 *
 * Lazy + bare ? mmh reader writer?
 *
 * DONE ro inside instance writeable => geht oder geht nicht in moose? => NEIN
 *******************************************************************************
 * DONE: is             =>      'ro', 'rw', 'bare'
 *
 * DONE:isa             =>      MooTools type => default, builder, writer, accessor, constructor
 *      OBJECT TYPES ???
 *
 *      'element' - (string) If object is a DOM element node.
 *      'textnode' - (string) If object is a DOM text node.
 *      'whitespace' - (string) If object is a DOM whitespace node.
 *      'arguments' - (string) If object is an arguments object.
 *      'array' - (string) If object is an array.
 *      'object' - (string) If object is an object.
 *      'string' - (string) If object is a string.
 *      'number' - (string) If object is a number.
 *      'date' - (string) If object is a date.
 *      'boolean' - (string) If object is a boolean.
 *      'function' - (string) If object is a function.
 *      'regexp' - (string) If object is a regular expression.
 *      'class' - (string) If object is a Class (created with new Class, or the extend of another class).
 *      'collection' - (string) If object is a native htmlelements collection, such as childNodes, getElementsByTagName, etc.
 *      'window' - (string) If object is the window object.
 *      'document' - (string) If object is the document object.
 *      'event' - (string) If object is an event.
 *      'undefined'
 *      'null'
 *
 * DONE required        => $bool   die if attribute was not set via constructor, default, builder
 *
 * DONE lazy                 => $bool    must have default or builder
 *  test lazy => clear => get
 *      kriegt man da das default/builder wieder?   => JA => WORKS test11
 *      bei moose?                                  => JA => WORKS test11
 *      mit und ohne setting via constructor        => JA => WORKS test11
 * DONE test typecheck
 * trigger?
 *
 * lazy_build           => $bool    same as
 *                                  builder   => '_build_size',
 *                                  clearer   => 'clear_size',
 *                                  predicate => 'has_size',
 *
 * DONE default         =>
 *
 * DONE documentation   => string   NOT USED ANYWAY, can be accessed through object.has.<accessorname>.documentation
 *
 * DONE reader          => string
 *
 * DONE writer          => string
 *
 * DONE predicate       => string   checks defined-ness
 *
 * DONE builder         => string   methodname, return value for attribute
 *
 * DONE clearer         => string   set to undefined
 *
 * DONE trigger         => string   called after accessor was set, $size, $old_size, $was_unset_before
 ******************************************************************************/

    // getter/setter NAME transformation
var defaultToMemberName = function (name) { return '___' + name; },
    defaultToGetterName = function (name) { return name; }, 
    defaultToSetterName = function (name) { return name; },
    
    $empty = function () {}, // used to exitst in mootools
    
    // allowed values
    allowed_values_for = {
        is: { ro: true, rw: true, bare: true }
    },
    
    // multiple ways to explain same thing
    sanitize_definition = function (definition) {
        if (!allowed_values_for.is[definition.is]) definition.is = 'bare';
        return definition;
    },
    
    // getters / setters
    default_set = function (instance, membername, value) {
        instance[membername] = value;
    },
    default_set_ro = function (name) { throw new Error ('Accessor "' + name + '" is readonly.'); },
    
    // initializing through builder / default
    get_default_value = function (definition) {
        if (definition.has('default'))  return function () { return definition.get('default'); } // TODO standalone => no need to be closures
        if (!definition.has('builder')) return false;
        return function (instance) { return instance[definition.get('builder')](); }; // TODO standalone => no need to be closures
    },
    
    get_typecheck = function (membername, name, definition) {
        // no isa for attribute
        if (!definition.has('isa')) return $empty;
        
        var allowedtypes = {};
        definition.isa.split(/\|/).each(function (el) { allowedtypes[el] = true; });
        
        return function (val) {
            var checktype;
            if (val === undefined)  checktype = "undefined";
            else if (val === null)  checktype = "null";
            else                    checktype = typeOf(val);

            if (!allowedtypes[checktype]) throw new Error(
                'Type constraint ' +
                name + ' may only be ' + definition.isa +
                ', but a ' + checktype + ' (' + val +
                ') was set.'
            );
        };
    },
    
    get_trigger = function (membername, name) {
        return function (instance, newvalue) {
            instance.fireEvent(
                'change:' + name,
                instance[membername],
                newvalue,
                instance.hasOwnProperty(membername)
            );
        };
    },
    
    // Getter and Setter Methods as closures
    defaultGetter = function (membername, name, definition) {
            // initial values through builder / default
        var get_init_value = get_default_value(definition);
            set = defaultSetter(membername, name, definition);

        return function () {
            // initialize through builder / default after clear
            if (!this.hasOwnProperty(membername) && get_init_value) {
                set.bind(this)(get_init_value(this));
            }
            
            return this[membername];
        };
    },
    
    defaultSetter = function (membername, name, definition) {
        var typecheck = get_typecheck(membername, name, definition),
            trigger = get_trigger(membername, name, definition);
        
        return function (value) {
            typecheck(value);
            trigger(this, value);
            default_set(this, membername, value);
        }; 
    },
    
    defaultGetSetter = function (membername, name, definition) {
            // initial setter
            var set = definition.is == 'rw' ?
                    defaultSetter(membername, name, definition) :
                    function () { return default_set_ro(name); },
            
            // initial getter
            get = defaultGetter(membername, name, definition);
        
        return function (value) {
            if (arguments.length) { set.bind(this)(value); } // TODO: duplicate code for speed (get rid of binding)
            return get.bind(this)();
        };
    };
    

Class.Mutators.Attributes = function (attributes) {
    /* Dependency on Hash must not go away
       
       Something weird happens, when the attribute-Object is set to the class 
       via implements, as is done further down. Keys having undefined values no
       longer return true when {}.hasOwnProperty('...') is called. So Hash is
       used mainly as a wrapper, but also for convinience.
   */
    attributes = new Hash(attributes);

    var $member = attributes.$toMember || defaultToMemberName, // TODO: TEST 
        $getter = attributes.$toGetter || defaultToGetterName, // potential Bug
        $setter = attributes.$toSetter || defaultToSetterName; // in constructor
    
    ['$toMember', '$toGetter', '$toSetter'].each(function (specialKey) {
        attributes.erase(specialKey);
    });
    
    this.implement(new Events());
    
    // create Getter / Setter
    attributes.each(function (definition, name) {
        // while we're at it, cast the definitions also to Hashes, lazyness FTW
        definition = new Hash(definition);
        attributes.set(name, definition);
        
        var localdefinition = sanitize_definition(definition),
            localname       = name,
            membername      = $member(name);
        
        definition.set('_membername', membername);
        
        // bare attributes don't have getters / setters
        if (definition.is != 'bare') {
            var gettername = $getter(name),
                settername = $setter(name);
                
            if (gettername == settername) {
                this.implement(gettername, defaultGetSetter(membername, localname, localdefinition));
            } else {
                this.implement(gettername, defaultGetter(membername, localname, localdefinition));
                this.implement(settername, defaultSetter(membername, localname, localdefinition));
            }
        }
        
        // reader
        if (definition.reader) {
            this.implement(
                definition.reader,
                defaultGetter(membername, localname, localdefinition)
            );
        }
        
        // writer
        if (definition.writer) {
            this.implement(
                definition.writer,
                defaultSetter(membername, localname, localdefinition)
            );
        }
        
        // predicate
        if (definition.predicate) {
            this.implement(
                definition.predicate,
                function () { return this.hasOwnProperty(membername);  }
            );
        }

        // clearer
        if (definition.clearer) {
            this.implement(
                definition.clearer,
                function () { delete this[membername]; }
            );
        }
        
    }, this);

    // implement setAttributes
    this.implement({
        
        // store attributes for later use
        $attributes: attributes,
        
        setAttributes: function (instanceAttributes) {
            instanceAttributes = instanceAttributes || {};
            
            // set contructor values / defaults / builders
            this.$attributes.each(function (definition, name) {
                
                var membername = definition._membername,
                    init_value_from_class = get_default_value(definition);
                    
                if (instanceAttributes.hasOwnProperty(name) || init_value_from_class) {
                    var set = defaultSetter(membername, name, definition),
                        value = instanceAttributes.hasOwnProperty(name) ? instanceAttributes[name] : init_value_from_class(this);
                    
                    set.bind(this)(value);
                }
                
                // required / after value should have been set
                if (definition.required && !this.hasOwnProperty(membername)) {
                    throw(new Error('Accessor is required, but was not set via constructor, default or builder. Accessor: "'+ name +'".'));
                }
                
            }, this)
            
        }
    
    });
    
};

})();