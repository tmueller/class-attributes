(function () {

var Lazy = Class.Attribute.Lazy = new Class({

    Extends: Class.Attribute,
    
    _performChecks: function () {
        this.parent();
        
        if (!this.hasInit) {
            throw new Error('Lazy Attribute requires default or builder. ' +
                            'Accessor: "'+ this.getName() +'".');
        }
    },
    
    // apply only myself, but all parameters are passed to check definedness
    applyConstructor: function (instance, parameters) {
        var name = this.getName();
        
        // value set via constructor
        if (parameters.hasOwnProperty(name)) {
            this.generateWritingConstructor().apply(instance, [parameters[name]]);
        }
        
        // no required check anymore, because we are lazy => so we have at least
        // a builder or default (sanitize Options makes sure)
    },
    
    // methodGenerators ////////////////////////////////////////////////////////
    generateReadingAccessor: function () {
        if (!this._readingAccessor) {
            var membername  = this.getMembername(),
                isset       = this.generatePredicate(),
                writer      = this.generateWritingAccessor(),
                initer      = this.generateInitValue();
            
            this._readingAccessor = function () {
                if (!isset.apply(this)) writer.apply(this, [initer.apply(this)]);
                return this[membername];
            };
        }
        return this._readingAccessor;
    }

});

})();