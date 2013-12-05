define( function ( require, exports, module ) {

    var HANDLER_CACHE = {},
        LISTENER_CACHE = {},
        ShapeEvent = require( "graphic/shapeevent" ),
        Utils = require( "core/utils" );

    function listen( obj, type, handler, isOnce ) {

        var handlerList = null,
            shape = this,
            eid = this._EventListenerId;

        if ( !HANDLER_CACHE[ eid ] ) {
            HANDLER_CACHE[ eid ] = {};
        }

        if ( !HANDLER_CACHE[ eid ][ type ] ) {

            HANDLER_CACHE[ eid ][ type ] = [];

            //监听器
            LISTENER_CACHE[ eid ] = function ( e ) {

                e = new ShapeEvent( e || window.event );

                Utils.each( HANDLER_CACHE[ eid ][ type ], function ( fn, index ) {

                    var result;

                    if ( fn ) {

                        result = fn.call( shape, e );

                        //once 绑定， 执行完后删除
                        if ( isOnce ) {

                            shape.off( type, fn );

                        }

                    }

                    return result;

                } );


            };

            //绑定事件
            bindEvent( obj, type, LISTENER_CACHE[ eid ] );

        }

        handlerList = HANDLER_CACHE[ eid ][ type ];

        handlerList.push( handler );

        return handlerList.length - 1;

    }

    function bindEvent( obj, type, handler ) {

        if ( obj.addEventListener ) {

            obj.addEventListener( type, handler, false );

        } else {

            obj.attachEvent( "on" + type, handler );

        }

    }

    function deleteEvent( obj, type, handler ) {

        if ( obj.removeEventListener ) {

            obj.removeEventListener( type, handler, false );

        } else {

            obj.detachEvent( type, handler );

        }

    }

    return require( 'core/class' ).createClass( 'EventHandler', {

        constructor: function () {

            //当前对象的事件处理器ID
            this._EventListenerId = +new Date()+''+Math.floor( Math.random() * 10000 );

        },

        addEventListener: function ( type, handler ) {

            return this._addEvent( type, handler, false );

        },

        _addEvent: function ( type, handler, isOnce ) {

            var record = {},
                isOnce = !!isOnce;

            if ( typeof type === 'string' ) {
                type = type.replace( /^\s+|\s+$/g, '' ).split( /\s+/ );
            }

            var shape = this;
            var node = this.node;

            Utils.each( type, function ( currentType ) {

                record[ currentType ] = listen.call( shape, node, currentType, handler, isOnce );

            } );

            return this;

        },

        addOnceEventListener: function ( type, handler ) {

            return this._addEvent( type, handler, true );

        },

        removeEventListener: function ( type, handler ) {

            var handlerList = null,
                needRemove = true;

            try {
                handlerList = HANDLER_CACHE[ this._EventListenerId ][ type ];
            } catch ( e ) {
                return;
            }

            //移除指定的监听器
            if ( typeof handler === 'function' ) {

                Utils.each( handlerList, function ( fn, index ) {

                    if ( fn === handler ) {
                        delete handlerList[ index ];
                    } else if ( !!fn ) {
                        needRemove = false;
                    }

                } );

            }


            //删除所有监听器
            if ( handler === undefined || needRemove ) {

                HANDLER_CACHE[ this._EventListenerId ][ type ] = null;

                deleteEvent( this.node, type, LISTENER_CACHE[ this._EventListenerId ] );

                LISTENER_CACHE[ this._EventListenerId ][ type ] = null;

            }

            return this;

        },

        on: function () {
            return this.addEventListener.apply( this, arguments );
        },

        off: function () {
            return this.removeEventListener.apply( this, arguments );
        },

        once: function () {
            return this.addOnceEventListener.apply( this, arguments );
        },

        trigger: function ( type, param ) {

            var evt = new CustomEvent( type, {
                bubbles: true,
                cancelable: true
            } );

            evt.__kity_param = param;

            this.node.dispatchEvent( evt );

        }

    } );

} );