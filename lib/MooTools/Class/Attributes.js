(function () {

    
Class.Mutators.Attributes = function (attributes) {
    // triggers implemented via fireEvent
    this.implement(new Events());
    
    /* Dependency on Hash must not go away
       
       Something weird happens, when the attribute-Object is set to the class 
       via implements, as is done further down. Keys having undefined values no
       longer return true when {}.hasOwnProperty('...') is called. So Hash is
       used mainly as a wrapper, but also for convinience.
   */
    var attributeStore = new Hash();
    
    Object.each(attributes, function (definition, name) {
        
        // instantiate Attribute-Classes
        attributeStore.set(name, 
            definition.lazy         ||
            definition.lazyBuild    ||
            definition.lazy_build   ?
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