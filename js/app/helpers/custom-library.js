define(function(){
	var _ = (function(){
		'use strict';
		
		function _(o){
			if(!(this instanceof _)){
				return new _(o);
			}
			this.o = o;
		}
		
		_.isObject = function(arg){
			return arg === Object(arg);
		}
		
		//	Works only with {} and instances
		_.isRealObject = function(arg){
			var str = Object.prototype.toString.call(arg);
			return	arg === Object(arg) && 
					str != '[object Array]' && 
					str != '[object Function]' && 
					str != '[object Math]';
		};
			
		_.isArray = function(arg){
			return Object.prototype.toString.call(arg) === '[object Array]';
		};
		
		_.clone = function(obj){
			if(_.isObject(obj)){
				var clone = Object.create(Object.getPrototypeOf(obj)),
				i,
				descriptor,
				keys = Object.getOwnPropertyNames(obj);

				for(i=0; i<keys.length; i++){
					descriptor = Object.getOwnPropertyDescriptor(obj, keys[i]);

					if(descriptor.value && typeof descriptor.value === 'object'){
						descriptor.value = _.clone(descriptor.value);
					}

					Object.defineProperty(clone, keys[i], descriptor);
				}
				
				return clone;
			}
			else{
				throw new Error("The 'clone' method expected an object.");
			}
		};
		
		_.maxArr = function(arr){
			if(_.isArray(arr)){
				var max = -Infinity,
					i;
			
				for(i=0; i<arr.length; i++){
					if(arr[i] > max){
						max = arr[i];
					}
				}
				
				return max;
			}
			else{
				throw new Error("The 'maxArr' method expected an array.");
			}
		}
		
		_.minArr = function(arr){
			if(_.isArray(arr)){
				var min = Infinity,
					i;
				
				for(i=0; i<arr.length; i++){
					if(arr[i] < min){
						min = arr[i];
					}
				}
				
				return min;
			}
			else{
				throw new Error("The 'minArr' method expected an array.");
			}
		}
		
		_.randomIntBetween = function(min, max){
			return Math.floor(Math.random() * (max - min + 1) + min);
		}
		
		_.randomBoolean = function(){
			return Math.random() < 0.5;
		}
		
		_.prototype = {
			
			each: function(callback){
				var result, i;
				
				if(_.isRealObject(this.o)){
					for(i in this.o){
						if(this.o.hasOwnProperty(i)){
							result = callback.call(this.o, i);
							if(result === false){
								break;
							}
						}
					}
				}
				else if(_.isArray(this.o)){
					for(i=0; i<this.o.length; i++){
						result = callback.call(this.o, i);
						if(result === false){
							break;
						}
					}
				}
				else{
					throw new Error("The 'each' method expected an object or array.");
				}
			},
			
			extend: function(parentClass){
				if(!Object.create){
					Object.prototype.create = function(proto){
						function F(){}
						F.prototype = proto;
						return new F();
					}
				}
				this.o.prototype = Object.create(parentClass.prototype);
				this.o.prototype.constructor = this;
			},
			
			addEvent: function(type, fn){
				if(this.o.addEventListener){
					this.o.addEventListener(type, fn, true);
				}
				else if(this.o.attachEvent){
					this.o.attachEvent('on' + type, fn);
				}
			},
			
			removeEvent: function(type, fn){
				if(this.o.removeEventListener){
					this.o.removeEventListener(type, fn, true);
				}
				else if(this.o.detachEvent){
					this.o.detachEvent('on' + type, fn);
				}
			}
			
		};
		
		return _;
	})();
	
	return _;
});