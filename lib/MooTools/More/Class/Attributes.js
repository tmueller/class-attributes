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

Class.Mutators.Attributes = function (attributes) {
    // triggers via fireEvent
    this.implement(new Events());
    
    /* Dependency on Hash must not go away
       
       Something weird happens, when the attribute-Object is set to the class 
       via implements, as is done further down. Keys having undefined values no
       longer return true when {}.hasOwnProperty('...') is called. So Hash is
       used mainly as a wrapper, but also for convinience.
   */
    var attributeStore = new Hash();
    
    // create Getter / Setter
    Object.each(attributes, function (definition, name) {
        
        // TODO: more api-ish way to define which Attribute Class should be used
        attributeStore.set(name,
            definition.hasOwnProperty('lazy') ?
                new Class.Attribute.Lazy(name, definition, this) :
                new Class.Attribute(name, definition, this)
        );
        
    }, this);

    // implement setAttributes
    this.implement({
        
        // store attributes for later use
        $attributes: attributeStore,
        
        setAttributes: function (instanceAttributes) {
            instanceAttributes = instanceAttributes || {};
            
            // set contructor values / defaults / builders
            this.$attributes.each(function (attribute) {
                attribute.applyConstructor(this, instanceAttributes);
            }, this);
        }
    
    });
    
};

})();