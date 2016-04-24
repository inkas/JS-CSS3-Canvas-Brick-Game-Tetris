define(['customLibrary'], function(_){
	'use strict';
	
	var ROW_COUNT = 20,
		COL_COUNT = 10,
		CUBE_SIZE = 14;
		
	HTMLAudioElement.prototype.stop = function(){
		this.pause();
		this.currentTime = 0;
		return this;
	}
	
	HTMLAudioElement.prototype.isPlaying = function(){
		if(this.duration && !this.paused && !this.ended){
			return true;
		}
		return false;
	}

	var StopWatch = (function(){
		function StopWatch(){}
		
		StopWatch.prototype = {
			
			startTime: function(){
				this._startTime = new Date();
				return this;
			},
			
			endTime: function(){
				this._endTime = new Date();
				return this;
			},
			
			getSeconds: function(){
				if(!this._startTime)
					throw new Error('The stopwatch was not started.');
				else if(!this._endTime)
					throw new Error('The stopwatch has not ended.');
				else
					return Math.round(((this._endTime.getTime() - this._startTime.getTime()) / 1000) * 100) / 100;
			},
			
			getMinutes: function(){
				return Math.round((this.getSeconds() / 60) * 100) / 100;
			}
			
		};
		
		return StopWatch;
	})();
	
	var SoundManager = (function(){
		function SoundManager(){
			this.playList = [];
			this.isMuted = false;
		}
		
		SoundManager.prototype = {
			
			add: function(name, filePathsArr){
				switch(name){
					case 'add':
					case 'mute':
					case 'stopAll':
						throw new Error("Sound name should be different than 'add', 'mute', 'stop'");
						break;
				}
				
				var regExt = /(?:\.([^.]+))?$/;
				var audio = document.createElement('audio');
				
				for(var i = 0; i < filePathsArr.length; i++){
					var fileExtension = regExt.exec(filePathsArr[i]),
						type;
					
					switch(fileExtension[1]){
						case 'wav':
							type = 'wav';
							break;
						case 'ogg':
							type = 'ogg';
							break;
						case 'mp3':
							type = 'mpeg';
							break;
						default:
							throw new Error('Unsupported sound file type ' + fileExtension[0]);
					}
					
					var src = document.createElement('source');
					src.setAttribute("src", filePathsArr[i]);
					src.setAttribute("type", 'audio/' + type);
					audio.appendChild(src);
				}
				
				this.playList.push(audio);
				this[name] = this.playList[this.playList.length - 1];
			},
			
			mute: function(){
				if(this.isMuted){
					_(this.playList).each(function(i){
						this[i].volume = 1;
					});
					this.isMuted = false;
				}
				else{
					_(this.playList).each(function(i){
						this[i].volume = 0;
					});
					this.isMuted = true;
				}
			},
			
			stopAll: function(){
				_(this.playList).each(function(i){
					this[i].stop();
				});
			}
			
		};
		
		return SoundManager;
	})();
	
	var Box = (function(){
		function Box(row, col, state){
			this._row = row;
			this._col = col;
			if(arguments[2]){
				this._state = state;
			}
		}
		
		return Box;
	})();
	
	var RotatableBox = (function(){
		function RotatableBox(row, col){
			Box.call(this, row, col);
		}
		
		_(RotatableBox).extend(Box);
		
		RotatableBox.prototype = {
			
			rotateCW: function(rowP, colP){
				return new RotatableBox(
					rowP + colP - this._col,
					colP - rowP + this._row
				);
			},
			
			rotateCCW: function(rowP, colP){
				return new RotatableBox(
					rowP - colP + this._col,
					colP + rowP - this._row
				);
			}
			
		};
		
		return RotatableBox;
	})();
	
	var TetrisShape = (function(){
		var self;
		
		function TetrisShape(shapeType){
			self = this;
			this._coords = {};
			if(this.isValidShape(shapeType)){
				this._shapeType = shapeType;
				switch(this._shapeType){
					case 'T':
						this.createT();
						break;
					case 'J':
						this.createJ();
						break;
					case 'L':
						this.createL();
						break;
					case 'Z':
						this.createZ();
						break;
					case 'S':
						this.createS();
						break;
					case 'I':
						this.createI();
						break;
					case 'O':
						this.createO();
						break;
				}
			}
			else{
				throw new Error("Invalid shape type."); 
			}
		}
		
		TetrisShape.prototype = {
			
			isValidShape: function(type){
				switch(type){
					case 'T':
					case 'J':
					case 'L':
					case 'Z':
					case 'S':
					case 'I':
					case 'O':
						return true;
						break;
					default:
						return false;
				}
			},
			
			fixPosition: function(position){
				var rows = [],
					cols = [],
					row,
					mostLeftCol;
				
				_(this._coords).each(function(i){
					rows.push(this[i]._row);
					cols.push(this[i]._col);
				});
				
				mostLeftCol = _.minArr(cols);
				
				switch(position){
					case 'topCenter':
						var	gridTopRow = ROW_COUNT - 1;
						
						row = _.maxArr(rows);
						_(this._coords).each(function(i){
							if(this[i]._row == row){
								this[i]._row = gridTopRow;
							}
							else{
								this[i]._row = gridTopRow - (row - this[i]._row);
							}
							if(self._shapeType != 'O'){
								this[i]._col += 3 - mostLeftCol;
							}
							else{
								this[i]._col += 3;
							}
						});
						break;
					case 'bottomLeft':
						row = _.minArr(rows);
						if(this._shapeType != 'O'){
							_(this._coords).each(function(i){
								this[i]._row -= row;
								this[i]._col -= mostLeftCol;
							});
						}
						break;
					default:
						throw new Error('Invalid position to fix!');
				}
			},
			
			randomizePosition: function(){
				if(this._shapeType != 'O'){
					var pivot = this._coords._box3,
						randomPositionNumber = _.randomIntBetween(0, 3),
						i;
					
					for(i=0; i<randomPositionNumber; i++){
						_(this._coords).each(function(key){
							if(this[key] != pivot){
								this[key] = this[key].rotateCW(pivot._row, pivot._col);
							}
						});
					}
				}
			},
			
			createT: function(){
				this._coords._box1 = new RotatableBox(1, 1);
				this._coords._box2 = new RotatableBox(0, 0);
				this._coords._box3 = new RotatableBox(0, 1);
				this._coords._box4 = new RotatableBox(0, 2);
			},
			
			createJ: function(){
				this._coords._box1 = new RotatableBox(2, 0);
				this._coords._box2 = new RotatableBox(1, 0);
				this._coords._box3 = new RotatableBox(1, 1);
				this._coords._box4 = new RotatableBox(1, 2);
			},
			
			createL: function(){
				this._coords._box1 = new RotatableBox(2, 2);
				this._coords._box2 = new RotatableBox(1, 0);
				this._coords._box3 = new RotatableBox(1, 1);
				this._coords._box4 = new RotatableBox(1, 2);
			},
			
			createZ: function(){
				this._coords._box1 = new RotatableBox(2, 0);
				this._coords._box2 = new RotatableBox(2, 1);
				this._coords._box3 = new RotatableBox(1, 1);
				this._coords._box4 = new RotatableBox(1, 2);
			},
			
			createS: function(){
				this._coords._box1 = new RotatableBox(2, 1);
				this._coords._box2 = new RotatableBox(2, 2);
				this._coords._box3 = new RotatableBox(1, 1);
				this._coords._box4 = new RotatableBox(1, 0);
			},
		
			createI: function(){
				this._coords._box1 = new RotatableBox(3, 0);
				this._coords._box2 = new RotatableBox(3, 1);
				this._coords._box3 = new RotatableBox(3, 2);
				this._coords._box4 = new RotatableBox(3, 3);
			},
			
			createO: function(){
				this._coords._box1 = new Box(1, 1);
				this._coords._box2 = new Box(1, 2);
				this._coords._box3 = new Box(2, 1);
				this._coords._box4 = new Box(2, 2);
			}
			
		};

		return TetrisShape;
	})();

	var Tetris = (function(){
		var self;
		
		function Tetris(canvas){
			self = this;
			this.ctx = canvas.getContext('2d');
			this.canvasWidth = canvas.width;
			this.canvasHeight = canvas.height;
			this.rotation = 'CW';
			this._isTurnedOn = false;
			this._isStarted = false;
			this._visualSpeed = 0;
			this._level = 0;
			this.mainFieldStartPoint = {
				x: 8,
				y: 398
			};
			this.nextShapeFieldStartPoint = {
				x: 195,
				y: 146
			};
		}
		
		Tetris.prototype = {
			
			addMovementEventListeners: function(){
				_(document).addEvent('keydown', eventHandlers.handleKeyDown);
				_(document).addEvent('keyup', eventHandlers.handleKeyUp);
				eventHandlers.clearIntervals();
			},
			
			removeMovementEventListeners: function(){
				_(document).removeEvent('keydown', eventHandlers.handleKeyDown);
				_(document).removeEvent('keyup', eventHandlers.handleKeyUp);
				eventHandlers.resetKeys();
				eventHandlers.clearIntervals();
			},
			
			putShapeToField: function(shapeToPlace, temporaryField){
				_(shapeToPlace._coords).each(function(key){
					temporaryField[this[key]._row][this[key]._col]._state = 1;
				});
			},
			
			moveDown: function(){
				var activeShapeTmp = _.clone(this._activeShape);
				var collision = false;
				
				_(activeShapeTmp._coords).each(function(key){
					this[key]._row--;
					if(this[key]._row < 0 || self._field[this[key]._row][this[key]._col]._state){
						collision = true;
						return false;
					}
				});
				placeShapeActions.call(this, collision, activeShapeTmp);
				return collision;
			},
			
			moveLeft: function(){
				if(!this.mainLoop)
					this.startMainLoop();
				var activeShapeTmp = _.clone(this._activeShape);
				var collision = false;
				
				_(activeShapeTmp._coords).each(function(key){
					this[key]._col--;
					if(this[key]._col < 0 || self._field[this[key]._row][this[key]._col]._state){
						collision = true;
						return false;
					}
				});
				placeShapeActions.call(this, collision, activeShapeTmp);
			},
			
			moveRight: function(){
				if(!this.mainLoop)
					this.startMainLoop();
				var activeShapeTmp = _.clone(this._activeShape);
				var collision = false;
				
				_(activeShapeTmp._coords).each(function(key){
					this[key]._col++;
					if(this[key]._col > COL_COUNT - 1 || self._field[this[key]._row][this[key]._col]._state){
						collision = true;
						return false;
					}
				});
				placeShapeActions.call(this, collision, activeShapeTmp);
			},
			
			rotate: function(){
				if(!this.mainLoop)
					this.startMainLoop();
				
				if(this._activeShape._shapeType != 'O'){
					var activeShapeTmp = _.clone(this._activeShape);
					var collision = false;
					var pivot = activeShapeTmp._coords._box3;
					
					_(activeShapeTmp._coords).each(function(key){
						if(self.rotation == 'CW')
							this[key] = this[key].rotateCW(pivot._row, pivot._col);
						else
							this[key] = this[key].rotateCCW(pivot._row, pivot._col);
						
						if(	this[key]._row >= 0 && this[key]._col >= 0 && 
							this[key]._row < ROW_COUNT && this[key]._col < COL_COUNT){
							if(self._field[this[key]._row][this[key]._col]._state){
								collision = true;
								return false;
							}
						}
						else{
							collision = true;
							return false;
						}
					});
					placeShapeActions.call(this, collision, activeShapeTmp);
				}
			},
			
			startMainLoop: function(fireType){
				this.mainLoop = this.mainLoop || {};
				this.mainLoop.rowClearingState = this.mainLoop.rowClearingState || false;
				if(!this._gameDuration){
					this._gameDuration = new StopWatch();
					this._gameDuration.startTime();
				}
				this.stopMainLoop();

				function mainLoop(){
					var collision = self.moveDown();
					var bottomReachActions = function(){
						self._field = _.clone(self._fieldTmp);
						self.nextShapeFieldTmp = _.clone(self.nextShapeField);
						self._activeShape = self._nextShape;
						self._activeShape.fixPosition('topCenter');
						self._nextShape = getRandomShapeAndPos();
						self._nextShape.fixPosition('bottomLeft');
						self.putShapeToField(self._activeShape, self._fieldTmp);
						self.putShapeToField(self._nextShape, self.nextShapeFieldTmp);
						self.drawAll();
					};
					
					if(collision){
						var rowsToClear = [];
						_(self._fieldTmp).each(function(i){
							var counter = 0;
							_(this[i]).each(function(j){
								if(this[j]._state)
									counter++;
								if(counter == COL_COUNT)
									rowsToClear.push(parseInt(i));
							});
						});
						
						if(rowsToClear.length){
							self.stopMainLoop();
							self.mainLoop.rowClearingState = true;
							_(rowsToClear).each(function(i){
								_(self._fieldTmp[this[i]]).each(function(j){
									this[j]._state = 0;
								});
							});
							self.drawAll();
							
							var fillRemovedRows = setInterval(function(){
								if(rowsToClear.length){
									for(var r=rowsToClear[0]; r<self._fieldTmp.length; r++){
										for(var c=0; c<COL_COUNT; c++){
											if(r != self._fieldTmp.length-1)
												self._fieldTmp[r][c]._state = self._fieldTmp[r+1][c]._state;
											else
												self._fieldTmp[r][c]._state = 0;
										}
									}
									self._score += 100;
									self.drawAll();
									_(rowsToClear).each(function(row){
										this[row]--;
									});
									rowsToClear.shift();
									return;
								}
								
								bottomReachActions();
								if(!self.sounds.intro.isPlaying())
									self.sounds.clear.stop().play();
								clearInterval(fillRemovedRows);
								self.mainLoop.rowClearingState = false;
								self.startMainLoop();
							}, 120);
						}
						else{
							bottomReachActions();
							
							var gameEnded = false;
							_(self._activeShape._coords).each(function(key){
								if(self._field[this[key]._row][this[key]._col]._state){
									gameEnded = true;
									return false;
								}
							});
							if(gameEnded){
								self.removeMovementEventListeners();
								self.stopMainLoop();
								self._gameOver = true;
								self.putShapeToField(self._activeShape, self._field);
								var blinkCount = 8;
								var visible = 0;
								var blink = setInterval(function(){
									if(blinkCount && self._isTurnedOn){
										if(visible){
											self._fieldTmp = _.clone(self._field);
										}
										else{
											_(self._fieldTmp).each(function(i){
												_(this[i]).each(function(j){
													this[j]._state = 0;
												});
											});
										}
										visible = -visible + 1;
										blinkCount--;
										self.drawAll();
										if(self.sounds.intro.ended)
											self.sounds.gameOver.stop().play();
									}
									else{
										clearInterval(blink);
									}
								}, 300);
							}
							else{
								if(!self.sounds.intro.isPlaying())
									self.sounds.crash.stop().play();
							}
						}

						if(self._gameDuration.endTime().getMinutes() > 2 && self._visualSpeed < 12){
							self._visualSpeed++;
							if(self._fastSpeed == null){
								self._speedTmp = self._speed;
								self._speedTmp = getRealSpeed(self._visualSpeed);
								self._speed = getFastSpeed(self._speedTmp);
							}
							else{
								self._speed = getRealSpeed(self._visualSpeed);
								self._fastSpeed = getFastSpeed(self._speed);
							}
							self._gameDuration.startTime();
						}
						self.drawAll();
					}

					if(!self.mainLoop.rowClearingState && !self._gameOver){
						self.mainLoop.loop = setTimeout(mainLoop, self._speed);
					}
				}

				if(!this.mainLoop.rowClearingState && !this._gameOver){
					if(fireType == 'immediately')
						mainLoop();
					else
						this.mainLoop.loop = setTimeout(mainLoop, this._speed);
				}
			},
			
			stopMainLoop: function(){
				try{
					clearTimeout(this.mainLoop.loop);
				}
				catch(e){}
			},
			
			clear: function(){
				this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
			},
			
			init: function(){
				this.sounds = new SoundManager();			
				this.sounds.add('intro', ['sounds/intro.ogg', 'sounds/intro.wav', 'sounds/intro.mp3']);
				this.sounds.add('move', ['sounds/move.ogg', 'sounds/move.wav', 'sounds/move.mp3']);
				this.sounds.add('crash', ['sounds/crash.ogg', 'sounds/crash.wav', 'sounds/crash.mp3']);
				this.sounds.add('clear', ['sounds/clear.ogg', 'sounds/clear.wav', 'sounds/clear.mp3']);
				this.sounds.add('gameOver', ['sounds/gameover.ogg', 'sounds/gameover.wav', 'sounds/gameover.mp3']);
				
				_(document.getElementById('start-btn')).addEvent('click', function(){
					if(self._isTurnedOn && !self._isStarted){
						self.start();
					}
				});
				_(document.getElementById('on-off-btn')).addEvent('click', function(){
					self._isTurnedOn ? self.turnOff() : self.turnOn();
				});
				_(document.getElementById('mute-btn')).addEvent('click', function(){
					if(self._isTurnedOn){
						self.sounds.mute();
						self.drawAll();
					}
				});
			},
			
			turnOn: function(){
				this._isTurnedOn = true;
				this._gameOver = false;
				this._score = 0;
				this._gameDuration = 0;
				this._fieldTmp = fieldGenerator(ROW_COUNT, COL_COUNT, this.mainFieldStartPoint);
				this.nextShapeField = fieldGenerator(4, 4, this.nextShapeFieldStartPoint);
				this.nextShapeFieldTmp = _.clone(this.nextShapeField);
				this.addMovementEventListeners();
				this.drawAll();
			},
			
			turnOff: function(){
				this._isTurnedOn = false;
				this._isStarted = false;
				this.removeMovementEventListeners();
				this.stopMainLoop();
				this._gameOver = true;
				this.sounds.stopAll();
				this.clear();
				this.initScreen();
			},
			
			start: function(){
				this._isStarted = true;
				this._speed = getRealSpeed(this._visualSpeed);
				this._fastSpeed = getFastSpeed(this._speed);
				this._field = fieldGenerator(ROW_COUNT, COL_COUNT, this.mainFieldStartPoint, this._level);
				this._fieldTmp = _.clone(this._field);
				this._activeShape = getRandomShapeAndPos();
				this._activeShape.fixPosition('topCenter');
				this._nextShape = getRandomShapeAndPos();
				this._nextShape.fixPosition('bottomLeft');
				this.putShapeToField(this._activeShape, this._fieldTmp);
				this.putShapeToField(this._nextShape, this.nextShapeFieldTmp);
				this.drawAll();
				if(this.sounds.intro.readyState >= 2)
					this.sounds.intro.play();
			},
			
			drawAll: function(){
				this.clear();
				drawToScreen.call(this);
				this.drawBoxes(this._fieldTmp, '#2a2a2a', 'rgba(42, 42, 42, .08)');
				this.drawBoxes(this.nextShapeFieldTmp, '#2a2a2a', 'rgba(0, 0, 0, 0)');
			},
			
			drawBoxes: function(field, filledColor, emptyColor){
				for(var i=0; i<field.length; i++){
					for(var j=0; j<field[i].length; j++){
						if(field[i][j]._state){
							this.drawBox(field[i][j]._x, field[i][j]._y, filledColor);
						}
						else{
							this.drawBox(field[i][j]._x, field[i][j]._y, emptyColor);
						}
					}
				}
			},
			
			drawBox: function(x, y, color) {
				this.ctx.lineWidth = 2;
				this.ctx.strokeStyle = color;
				this.ctx.fillStyle = color;
				this.ctx.strokeRect(x, y, CUBE_SIZE, CUBE_SIZE);
				this.ctx.fillRect(x+3, y+3, CUBE_SIZE-6, CUBE_SIZE-6);
				this.ctx.beginPath();
				this.ctx.moveTo(x+1, y+1);
				this.ctx.lineTo(x+3, y+3);
				this.ctx.moveTo(x+(CUBE_SIZE-1), y+1);
				this.ctx.lineTo(x+(CUBE_SIZE-3), y+3);
				this.ctx.moveTo(x+1, y+(CUBE_SIZE-1));
				this.ctx.lineTo(x+3, y+(CUBE_SIZE-3));
				this.ctx.moveTo(x+(CUBE_SIZE-3), y+(CUBE_SIZE-3));
				this.ctx.lineTo(x+(CUBE_SIZE-1), y+(CUBE_SIZE-1));
				this.ctx.stroke();
			},
			
			//	Main Container Border
			initScreen: function(){
				this.ctx.lineWidth = 1;
				this.ctx.strokeStyle = '#000000';
				this.ctx.strokeRect(4, 52, 184, 364);			
			}
			
		};

		var getRealSpeed = function(speed){
				return (13 - speed) * (700 / 13);
			},
		
			getFastSpeed = function(speed){
				return speed / 7;
			},
		
			increaseInitSettings = function(setting){
				if(setting < 12)
					setting++;
				else
					setting = 0;
				return setting;
			},
		
			placeShapeActions = function(collision, activeShape){
				if(!collision){
					this._activeShape = activeShape;
					this._fieldTmp = _.clone(this._field);
					this.putShapeToField(this._activeShape, this._fieldTmp);
					this.drawAll();
					if(!this.sounds.intro.isPlaying())
						this.sounds.move.stop().play();
				}
			},
		
			getRandomShapeAndPos = function(){
				var tetrisShapesArr = ['T', 'J', 'L', 'Z', 'S', 'I', 'O'],
					randomShape = new TetrisShape(tetrisShapesArr[_.randomIntBetween(0, tetrisShapesArr.length-1)]);
				
				randomShape.randomizePosition();
				return randomShape;
			},
		
			fieldGenerator = function(rows, columns, startPoint, _level){
				var field = [];
				
				for(var row = 0; row < rows; row++){
					field[row] = [];
					
					for(var col = 0; col < columns; col++){
						field[row][col] = {
							_x: (col * (CUBE_SIZE + 4)) + startPoint.x,
							_y: (-row * (CUBE_SIZE + 4)) + startPoint.y,
							_state: 0
						};
						
						if(_level>row){
							var fillCell = _.randomBoolean();
							
							if(col != COL_COUNT - 1){
								field[row][col]._state = fillCell ? 1 : 0;
							}
							else{
								if(fillCell){
									var isFullRowFilled = true;
									for(var i=0; i<col; i++){
										if(!field[row][i]._state){
											isFullRowFilled = false;
											break;
										}
									}
									field[row][col]._state = isFullRowFilled ? 0 : 1;
								}
								else{
									var isFullRowEmpty = true;
									for(var i=0; i<col; i++){
										if(field[row][i]._state){
											isFullRowEmpty = false;
											break;
										}
									}
									field[row][col]._state = isFullRowEmpty ? 1 : 0;
								}
							}
						}
						else{
							field[row][col]._state = 0;
						}
					}
				}
				
				return field;
			},
		
			eventHandlers = (function(){
				var keys = {
					keyUp: {state: false},
					keyLeft: {state: false},
					keyRight: {state: false},
					keyDown: {state: false}
				};
				
				function handleKeyDown(e){
					switch(e.which || e.keyCode){
						case 37:
						case 65:
							if(!keys.keyLeft.state){
								keys.keyLeft.interval = setInterval((function(){
									function fn(){
										if(self._isStarted){
											self.moveLeft();
										}
										else{
											self._visualSpeed = increaseInitSettings.call(self, self._visualSpeed);
											self.drawAll();
										}
									}
									fn();
									return fn;
								})(), self._isStarted ? 100 : 300);
								keys.keyLeft.state = true;
							}
							break;
						case 39:
						case 68:
							if(!keys.keyRight.state){
								keys.keyRight.interval = setInterval((function(){
									function fn(){
										if(self._isStarted){
											self.moveRight();
										}
										else{
											self._level = increaseInitSettings.call(self, self._level);
											self.drawAll();
										}
									}
									fn();
									return fn;
								})(), self._isStarted ? 100 : 300);
								keys.keyRight.state = true;
							}
							break;
						case 38:
						case 87:
							if(!keys.keyUp.state){
								keys.keyUp.interval = setInterval((function(){
									function fn(){
										if(self._isStarted){
											self.rotate();
										}
										else{
											if(self.rotation == 'CW')
												self.rotation = 'CCW';
											else
												self.rotation = 'CW';
											self.drawAll();
										}
									}
									fn();
									return fn;
								})(), 150);
								keys.keyUp.state = true;
							}
							break;
						case 40:
						case 83:
							if(!keys.keyDown.state){
								if(self._isStarted){
									self._speedTmp = self._speed;
									self._speed = self._fastSpeed;
									self._fastSpeed = null;
									self.startMainLoop('immediately');
								}
								keys.keyDown.state = true;
							}
							break;
					}
				}
				
				function handleKeyUp(e){
					switch(e.which || e.keyCode){
						case 37:
						case 65:
							if(keys.keyLeft.state){
								keys.keyLeft.state = false;
								clearInterval(keys.keyLeft.interval);
							}
							break;
						case 39:
						case 68:
							if(keys.keyRight.state){
								keys.keyRight.state = false;
								clearInterval(keys.keyRight.interval);
							}
							break;
						case 38:
						case 87:
							if(keys.keyUp.state){
								keys.keyUp.state = false;
								clearInterval(keys.keyUp.interval);
							}
							break;
						case 40:
						case 83:
							if(keys.keyDown.state){
								keys.keyDown.state = false;
								if(self._isStarted){
									self._fastSpeed = self._speed;
									self._speed = self._speedTmp;
									self.startMainLoop();
								}
								else
									self.start();
							}
							break;
					}
				}
				
				function clearIntervals(){
					_(keys).each(function(i){
						clearInterval(this[i].interval);
					});
				}
				
				function resetKeys(){
					_(keys).each(function(i){
						this[i].state = false;
					});
				}
			
				return {
					handleKeyDown: handleKeyDown,
					handleKeyUp: handleKeyUp,
					clearIntervals: clearIntervals,
					resetKeys: resetKeys
				};
			})(),
		
			drawToScreen = function(){
				this.initScreen();
				
				//	SCORE text
				this.ctx.fillStyle = '#2a2a2a';
				this.ctx.strokeStyle = '#2a2a2a';
				this.ctx.font = '100% Arial';
				this.ctx.textAlign = 'center';
				this.ctx.fillText('SCORE', 95, 18);
				
				//	NEXT text
				this.ctx.textAlign = 'left';
				this.ctx.fillText('NEXT', 195, 86);
				
				//	SPEED text
				this.ctx.fillText('SPEED', 195, 195);
				
				//	LEVEL text
				this.ctx.fillText('LEVEL', 195, 285);
				
				//	ROTATE text
				this.ctx.fillText('ROTATE', 195, 339);

				//	Rotation sign
				this.ctx.save();
				this.ctx.beginPath();
				if(this.rotation != 'CW'){
					this.ctx.translate(15, 718);
					this.ctx.scale(1, -1);
				}
				var startX = 210,
					startY = 366;
				this.ctx.moveTo(startX, startY);
				this.ctx.quadraticCurveTo(startX + 11, startY + 12, startX + 22, startY - 4);
				this.ctx.quadraticCurveTo(startX + 11, startY + 5, startX, startY);
				this.ctx.lineTo(startX + 4, startY + 8);
				this.ctx.lineTo(startX + 4.5, startY + 4);
				this.ctx.lineTo(startX + 8, startY - 2);
				this.ctx.closePath();
				this.ctx.fill();
				this.ctx.restore();
				
				//	Note icon
				if(!this.sounds.isMuted){
					this.ctx.save();
					this.ctx.beginPath();
					this.ctx.rotate(-30 * Math.PI/180);
					this.ctx.scale(1.5, 1);
					this.ctx.arc(16, 58, 2, 0, 2 * Math.PI);
					this.ctx.arc(23, 64, 2, 0, 2 * Math.PI);
					this.ctx.fill();
					this.ctx.closePath();
					this.ctx.restore();
					this.ctx.beginPath();
					this.ctx.moveTo(52, 37);
					this.ctx.lineTo(53, 29);
					this.ctx.lineTo(65, 27);
					this.ctx.lineTo(64, 37);
					this.ctx.stroke();
					this.ctx.moveTo(52.5, 33);
					this.ctx.lineTo(64, 31);
					this.ctx.stroke();
					this.ctx.closePath();
				}
				
				//	SCORE
				this.ctx.save();
				this.ctx.setTransform(0.67, 0, -0.07, 1, 0, 0);
				this.ctx.font = '3.6em DSDIGI';
				this.ctx.textAlign = 'center';
				this.ctx.fillText(this._score, 335, 43);
				
				//	Speed amount
				this.ctx.textAlign = 'right';
				this.ctx.setTransform(0.80, 0, -0.07, 1, 0, 0);
				this.ctx.font = '2.3em DSDIGI';
				this.ctx.fillText(this._visualSpeed, 315, 228);
				
				//	Level amount
				this.ctx.fillText(this._level, 318, 264);
				this.ctx.restore();
			};
		
		return Tetris;
	})();
	
	return Tetris;
});