String.implement('qw', function () { return this.split(/\s+/) });

window.TYPECHECKS = new Hash({

    'Element'       : {
        item:           new Element('div'),
        typename:       'Element',
        allowedtypes:   'Element'.qw()
    },
    
    'Elements'      : {
        item:           $$('body'),
        typename:       'Elements',
        allowedtypes:   'Elements'.qw()
    },
   
    'TextNode'      : {
        item:           document.createTextNode('MooTools FTW'),
        typename:       'TextNode',
        allowedtypes:   'TextNode'.qw()
    },
    
    'Array'         : {
        item:           [],
        typename:       'Array',
        allowedtypes:   'Array Elements'.qw()
    },
    
    'Object'        : {
        item:           {},
        typename:       'Object',
        allowedtypes:
            ('Object Element Elements TextNode Array String Number Date ' +
            'Boolean Function Class RegExp Window Document Event whitespace ' +
            'collection arguments').qw()
    },
    
    'StringPrimitive' : {
        item:           "",
        typename:       'StringPrimitive',
        realtypename:   'String',
        allowedtypes:   'String StringPrimitive'.qw()
    },
    
    'String'   : {
        item:           new String(""),
        typename:       'String',
        allowedtypes:   'String StringPrimitive'.qw()
    },
    
    'NumberPrimitve' : {
        item:           3,
        typename:       'NumberPrimitve',
        realtypename:   'Number',
        allowedtypes:   'Number NumberPrimitve'.qw()
    },
    
    'Number'   : {
        item:           new Number(3),
        typename:       'Number',
        allowedtypes:   'Number NumberPrimitve'.qw()
    },
    
    'Date'          : {
        item:           new Date(),
        typename:       'Date',
        allowedtypes:   'Date'.qw()
    },
    
    'BooleanPrimitive' : {
        item:           false,
        typename:       'BooleanPrimitve',
        realtypename:   'Boolean',
        allowedtypes:   'Boolean BooleanPrimitve'.qw()
    },
    
    'Boolean'       : {
        item:           new Boolean(false),
        typename:       'Boolean',
        allowedtypes:   'Boolean BooleanPrimitve'.qw()
    },
    
    'Function'      : {
        item:           function () {},
        typename:       'Function',
        allowedtypes:   'Function Class'.qw()
    },
    
    'Class'         : {
        item:           new Class({}),
        typename:       'Class',
        allowedtypes:   'Class'.qw()
    },
    
    'RegExp'        : {
        item:           /test/,
        typename:       'RegExp',
        allowedtypes:   'RegExp'.qw()
    },

    'Window'        : {
        item:           window,
        typename:       'Window',
        allowedtypes:   'Window'.qw()
    },

    'Document'      : {
        item:           document,
        typename:       'Document',
        allowedtypes:   'Document'.qw()
    },


    'Event'         : {
        item:           new Event({type:'testevent'}),
        typename:       'Event',
        allowedtypes:   'Event'.qw()
    },

    'whitespace'    : {
        item:           document.createTextNode(""),
        typename:       'whitespace',
        allowedtypes:   'whitespace'.qw()
    },


    'collection'    : {
        item:           document.getElementsByTagName('body'),
        typename:       'collection',
        allowedtypes:   'collection'.qw()
    },

    'arguments'     : {
        item:           (function get_args() { return arguments; })(),
        typename:       'arguments',
        allowedtypes:   'arguments'.qw()
    },


    'undefined'     : {
        item:           undefined,
        typename:       'undefined',
        allowedtypes:   'undefined'.qw()
    },


    'null'          : {
        item:           null,
        typename:       'null',
        allowedtypes:   'null'.qw()
    }


});