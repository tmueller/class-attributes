(function () {

// TODO: tests
Function.implement('require', function () {
    this.$required = true;
    return this;
});


// TODO: tests
Class.Mutators.Required = function (required) {
    
    Array.from(required).each(function (methodname) {
        if (methodname in this) return;
        this.implement(methodname, function () {
            throw new Error(
                'Method "' + methodname + '" has to be implemented.'
            );
        }.require());
    }, this);
    
};


})();