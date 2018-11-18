var _Math = {

    lerp: function ( x, y, t ) {

		return ( 1 - t ) * x + t * y;

	},

    randFloat: function ( low, high ) {

        return low + Math.random() * ( high - low );
    
    },

    mapLinear: function ( x, a1, a2, b1, b2 ) {

        return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
    
    },

    clamp: function ( value, min, max ) {

        return Math.max( min, Math.min( max, value ) );
    
    },

    randInt: function ( low, high ) {

        return low + Math.floor( Math.random() * ( high - low + 1 ) );
    
    }

};