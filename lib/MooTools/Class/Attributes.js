(function () {

    
Class.Mutators.Attributes = function (attributes) {
    // merge attributes with parent attributeDefinition
    // recursion is created through every child class merging its parentclass
    // => my parent has its own definition + its parents definition
    // => don't need to merge parents definition again
    var parentAttributes;
    if (this.parent && this.parent.prototype) {
        parentAttributes = this.parent.prototype.$attributedefinition;
        if (parentAttributes) {
            attributes = Object.merge(Object.clone(parentAttributes), attributes);
        }
    }
    
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
        var parentAttribute = parentAttributes && parentAttributes[name];
        if (parentAttribute) {
            /*console.log('definition', definition);
            console.log('parentAttribute', parentAttribute);            */
            
            // unfortunately we cannot narrow the accessormutability
            // 1st: the setter would be supplied by inheritance
            //  => simply deleting it could not be, what we want
            // 2nd: usually you expect your childclass to have all of its
            // parentclass' methods + more
            if (parentAttribute.is == 'rw' && definition.is == 'ro'     ||
                parentAttribute.is == 'ro' && definition.is == 'bare'   || 
                parentAttribute.is == 'rw' && definition.is == 'bare' ) {
                
                throw new Error(
                    'Cannot narrow down the accessormutability of accessor "' +
                    name + '" from "' + parentAttribute.is + '" to "' +
                    definition.is + '".'
                );
            }        
        }
        
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
        
        // store raw attributes for inheritance
        $attributedefinition: attributes,
        
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