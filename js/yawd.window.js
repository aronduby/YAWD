/*
 *	yawd.Window
 *	based on module pattern from http://nefariousdesigns.co.uk/archive/2010/10/object-oriented-javascript-follow-up-part-2-technical/
*/
var yawd = window.yawd || {};
yawd.Window = function(element, opts, app_id){

	// private variables
	opts = yawd.util.extend({}, yawd.Window.defaults, opts);
	
	// DRAGGING THE WINDOW
	var _mousedownEvent = {};
	var _dragOffset = {};
	// adding _allowDrag help smooth out the dragging so Math isn't used everytime and restore from a max window at the right time
	var _allowDrag = false;
	var _dragEvent = null;
	function _mouseDistanceMet(e){
		if(_allowDrag)
			return true;

		return _allowDrag = (Math.max(
				Math.abs(_mousedownEvent.pageX - e.pageX),
				Math.abs(_mousedownEvent.pageY - e.pageY)
			) >= opts.dragDistance
		);
	}
	function _dragStart(e){
		var self = pub,
			w = self.osWindow;

		// save the offset of mouse vs window
		_dragOffset = {
			top: e.clientY - w.offsetTop,
			left: e.clientX - w.offsetLeft
		};
		_mousedownEvent = e;

		// save the callback event for the dragging
		switch(e.target){
			case self.osWindowTitlebar:
				_dragEvent = _dragWindow;
				break;

			case self.osResizeHandle:
				_dragEvent = _resizeWindow;
				break;

			default:
				e.preventDefault();
				e.stopPropagation();
				return false;
		}
		
		document.addEventListener('mousemove', _dragCheck, false);
		
		yawd.addClass(w, yawd.cssClasses.misc.dragging);
	}
	function _dragCheck(e){
		if(_allowDrag){
			_distributeDrag(e);
		} else {
			if(_mouseDistanceMet(e)){
				_distributeDrag(e);
			}
		}
	}	
	function _dragEnd(e){
		var w = pub.osWindow;
		
		// remove drag class
		yawd.removeClass(w, yawd.cssClasses.misc.dragging);

		// remove the mousemove event from window
		document.removeEventListener('mousemove', _dragCheck, false);
		_allowDrag = false;
		_dragOffset = null;
		_dragEvent = null;
	}
	function _distributeDrag(e){
		_dragEvent(e);		
	}
	function _dragWindow(e){
		var self = pub,
			w = self.osWindow;

		// maximize if dragged above the screen
		
		if( e.clientY < opts.parent.offsetTop + 5){
			_dragEnd();
			if(self.maxxable)
				self.maximize(e);
			return true;		
		// minimize if below the screen
		} else if( e.clientY > opts.parent.offsetHeight - 5){
			_dragEnd();
			if(self.minable)
				self.minimize(e);
			return true;
		// snap to the right/left
		} else if( e.clientX < (opts.parent.offsetLeft + 5) || e.clientX > (opts.parent.offsetLeft + opts.parent.offsetWidth) - 5){
			_dragEnd();
			if(self.maxable){
				_saveState('normal');
				w.style.width = Math.max( opts.minWidth, window.innerWidth / 2) + 'px';
				w.style.height = Math.max( opts.minHeight, window.innerHeight ) + 'px';			
				// which side to snap it to
				w.style.left = e.clientX < 5 ? '0px' : '50%';
				w.style.top = 0;
				yawd.addClass(w, yawd.cssClasses.osWindow.maximized);
				self.isMaximized = true;
			}
			return true;
		}
		

		// maximized?
		if(self.isMaximized){
			full_width = w.offsetWidth;
			left_side = w.offsetLeft;
			self.maximize();
			
			// set left so that the mouse is in the middle of the window
			// _dragOffset.left = ( w.offsetWidth / 2 );
			// set left so the mouse is in the same relative position of the window
			_dragOffset.left = Math.floor( ( e.clientX / full_width ) * w.offsetWidth ) - left_side;
		}

		w.style.top = e.clientY - _dragOffset.top + 'px';
		w.style.left = e.clientX - _dragOffset.left + 'px';
	}
	function _resizeWindow(e){
		var self = pub,
			w = self.osWindow,
			rW = self.osResizeHandle.offsetWidth / 2,
			rH = self.osResizeHandle.offsetHeight / 2;
		
		new_width = Math.max( opts.minWidth, w.offsetWidth + ( e.clientX - ( w.offsetLeft + w.offsetWidth ) ) + rW );
		new_height = Math.max( opts.minHeight, w.offsetHeight + ( e.clientY - ( w.offsetTop + w.offsetHeight ) ) + rH );		
		
		w.style.width = new_width + 'px';
		w.style.height = new_height + 'px';
	}

	// RESIZING THE WINDOW
	var _savedState = {};
	function _saveState(state){
		var self = pub;
			w = self.osWindow,
			state = '';

		// state is either maximized, normal, or minimized
		// if it's not supplied figure out what we should be saving
		if(state == ''){
			if(self.isMinimized)
				state = 'minimized';
			else if (self.isMaximized)
				state = 'maximized';
			else
				state = 'normal';
		}

		_savedState[state] = {
			top: w.offsetTop,
			left: w.offsetLeft,
			width: w.offsetWidth,
			height: w.offsetHeight,
			opacity: w.style.opacity,
			MozTransform: w.style.MozTransform,
			display: w.style.display
		}
	}
	
	function _restoreState(state){
		var self = pub,
			w = self.osWindow;

		// if state isn't supplied figure out what we should be restoring
		if(state == ''){
			if(self.isMinimized)
				state = 'minimized';
			else if (self.isMaximized)
				state = 'maximized';
			else
				state = 'normal';			
		}
		var s = _savedState[state];

		w.style.top = s.top + 'px';
		w.style.left = s.left + 'px';
		w.style.width = s.width + 'px';
		w.style.height = s.height + 'px';
		w.style.opacity = s.opacity;
		w.style.MozTransform = s.MozTransform;
		w.style.display = s.display;
	}

	var pub = {	
		app_id: app_id,

		isMinimized: false,

		isMaximized: false,

		isCascaded: false,

		create: function(){
			var self = pub;

			document.body.style.cursor = 'wait';

			// make and save the window
			var osWindow = (self.osWindow = document.createElement('article'));
				// add it to the dom as specified in the opts
				opts.parent.appendChild(osWindow);
				osWindow.style.display = 'none';
				osWindow.style.position = 'absolute';
				osWindow.style.width = opts.width + 'px';
				osWindow.style.height = opts.height + 'px';
				osWindow.className = yawd.cssClasses.osWindow.main +' '+ opts.classes;
				osWindow.id = opts.id
				// setting tabIndex makes the div focusable
				// setting outline to 0 prevents a border on focus in Mozilla
				osWindow.tabIndex = -1;
				osWindow.style.outline = 0;
				osWindow.addEventListener(
					'mousedown', 
					self.moveToTop,
					false // ? 
				);

			// add in the title bar
			var osWindowTitlebar = (self.osWindowTitlebar = document.createElement('header'));
				osWindowTitlebar.className = yawd.cssClasses.osWindow.titlebar;
				// enable double click to max if allowed in options
				if(opts.maxable){
					osWindowTitlebar.addEventListener(
						'dblclick',
						self.maximize,
						false // ?
					);
				}
				osWindow.appendChild(osWindowTitlebar);

				// add label to title bar
				var osWindowLabel = (self.osWindowLabel = document.createElement('label'));
					osWindowLabel.className = yawd.cssClasses.osWindow.title;
					if(opts.closable){
						osWindowLabel.addEventListener(
							'dblclick',
							self.close,
							false // ?
						);
					}
					osWindowTitlebar.appendChild(osWindowLabel);

					// add icon to the title bar title
					if(opts.icon){
						var osWindowIcon = document.createElement('img');
							osWindowIcon.src = opts.icon;
							osWindowIcon.alt = 'application icon';
							osWindowIcon.className = yawd.cssClasses.osWindow.titlebarIcon;
							osWindowLabel.appendChild(osWindowIcon);
					}

					// add the text label to the label
					osWindowLabel.appendChild(document.createTextNode(opts.title));

				// minimize, maximize, and close buttons
				if(opts.minable && yawd.taskbar){
					var osWindowMinimize = document.createElement('button');
						osWindowMinimize.className = yawd.cssClasses.osWindow.minimizeBtn;
						osWindowMinimize.appendChild(document.createTextNode('min'));
						osWindowMinimize.addEventListener(
							'click',
							self.minimize,
							false // ?
						);
						osWindowTitlebar.appendChild(osWindowMinimize);							
				}

				if(opts.maxable){
					var osWindowMaximize = document.createElement('button');
						osWindowMaximize.className = yawd.cssClasses.osWindow.maximizeBtn;
						osWindowMaximize.appendChild(document.createTextNode('max'));
						osWindowMaximize.addEventListener(
							'click',
							self.maximize,
							false // ?
						);
						osWindowTitlebar.appendChild(osWindowMaximize);
				}

				if(opts.closable){
					var osWindowClose = document.createElement('button');
						osWindowClose.className = yawd.cssClasses.osWindow.closeBtn;
						osWindowClose.appendChild(document.createTextNode('close'));
						osWindowClose.addEventListener(
							'click',
							self.close,
							false // ?
						);
						osWindowTitlebar.appendChild(osWindowClose);
				}

			
			// window content
			var osWindowContent = (self.osWindowContent = document.createElement('section'));
				element.removeAttribute('title');
				element.style.display = 'block';
				osWindowContent.appendChild(element);
				osWindowContent.className = yawd.cssClasses.osWindow.content;
				// add it to the osWindow
				osWindow.appendChild(osWindowContent);


			// window footer
			var osWindowFooter = (self.osWindowFooter = document.createElement('footer'));
				osWindowFooter.className = yawd.cssClasses.osWindow.footer;
				osWindowFooter.appendChild(document.createTextNode(opts.footer));
				osWindow.appendChild(osWindowFooter);

			// resizable ?
			if(opts.resizable)
				self.makeResizable();

			// draggable
			if(opts.draggable)
				self.makeDraggable();
			
			// position
			if(opts.position)
				self.position(opts.position);

			if(opts.autoOpen)
				self.open();
		},

		open: function(){
			var self = pub;

			document.body.style.cursor = 'auto';
			self.osWindow.style.display = 'block';
			self.moveToTop();
			if(yawd.util.isFunction(opts.open))
				opts.open.apply(self);
			
			// broadcast the event
			yawd.trigger('open', self.osWindow, self.app_id);
			
			if(opts.taskbar !== false)
				self.getTaskbar().open();
		},
		
		// position in x y string
		position: function(pos_str){
			var self = pub,
				w = self.osWindow,
				pos = [],
				parent = opts.parent;
			
			pos = pos_str.split(' ');
			// if our array doesn't have a y, default it to center
			if(pos[1] == undefined)
				pos[1] = 'center';
			
			// we have to display the element to get offsetWidth
			// so make it invisible and then display
			w.style.visibility = 'hidden';
			w.style.display = 'block';
			
			// handle x
			switch(pos[0]){
				case 'center':
					w.style.left = ((parent.offsetWidth / 2) - (w.offsetWidth / 2)) + 'px';
					break;
				case 'left':
					w.style.left = '0px';
					break;
				case 'right':
					w.style.left = 'auto';
					w.style.right = '0px';
					break;
				default:
					w.style.left = pos[0];
			}

			// same with y
			switch(pos[1]){
				case 'center':
					w.style.top = ((parent.offsetHeight / 2) - (w.offsetHeight / 1.5)) + 'px';
					break;
				case 'top':
					w.style.top = '0px';
					break;
				case 'bottom':
					w.style.botom = '0px';
					break;
				default:
					w.style.top = pos[1];
			}

			// now reverse our display hack
			w.style.display = 'none';
			w.style.visibility = 'visible';
			
		},

		getTitle: function(){
			var title = pub.osWindowLabel;

			for(var i=0; i < title.childNodes.length; i++){
				// 3 == text node
				if(title.childNodes[i].nodeType == 3)
					return title.childNodes[i].nodeValue;
			}

			return false;
		},

		setTitle: function(newTitle){
			var self = pub,
				title = self.osWindowLabel;

			for(var i=0; i < title.childNodes.length; i++){
				// 3 == text node
				if(title.childNodes[i].nodeType == 3)
					title.childNodes[i].nodeValue = newTitle;
			}
			
			// make sure to update the taskbar
			self.getTaskbar().setTitle(newTitle);
			
		},

		minimize: function(e){
			var self = pub
				w = self.osWindow;

			self.moveToTop();
			
			// if the window isn't already minimized
			if(!self.isMinimized){
				_saveState();

				// I don't like how maximized windows are so huge on emphasize
				// so when they get minimized, temporarily restore their state
				if(self.isMaximized)
					_restoreState('normal');

				yawd.addClass(w, yawd.cssClasses.osWindow.minimized);
				w.style.display = 'none';
				// remove it from the zIndexes
				yawd.zIndexes.splice(yawd.zIndexes.indexOf( w.style.zIndex * 1 ), 1);
				w.style.zIndex = '0';
				self.isMinimized = true;
				yawd.trigger('minimized', w, self.app_id);

			} else {
				yawd.removeClass(w, yawd.cssClasses.osWindow.minimized);
				w.style.display = 'block';
				_restoreState(self.isMaximized ? 'maximized' : 'normal');
				self.isMinimized = false;
				yawd.trigger('restored', w, self.app_id);
			}
		},

		maximize: function(e){
			var self = pub,
				w = self.osWindow;

			// if the window isn't already in fullsize
			if(!self.isMaximized){
				// save the current dimentions			
				_saveState();
				
				// add class and make same size as parent
				yawd.addClass(w, yawd.cssClasses.osWindow.maximized);
				w.style.top = '0';
				w.style.left = '0';
				w.style.width = '100%';
				w.style.height = '100%';

				self.isMaximized = true;

				// trigger event
				yawd.trigger('maximized', w, self.app_id);
			
			} else {
				// restore the size
				_restoreState('normal');			

				// remove fullsizeClass
				yawd.removeClass(w, yawd.cssClasses.osWindow.maximized);

				self.isMaximized = false;
				
				// trigger event
				yawd.trigger('restored', w, self.app_id);
			}

			self.moveToTop();
		},

		close: function(){
			var self = pub,
				w = self.osWindow;

			// allow canceling of the close by the callback
			if(false === yawd.trigger('beforeClose', w, self.app_id))
				return;

			pub.osWindow.style.display = 'none';

			yawd.trigger('close', w, self.app_id);

			var removed = pub.osWindow.parentNode.removeChild(pub.osWindow);
			delete removed;
		},

		makeDraggable: function(){
			var self = pub,
				t = self.osWindowTitlebar;
			
			t.addEventListener('mousedown', _dragStart, false);
			document.addEventListener('mouseup', _dragEnd, false);
		},

		makeResizable: function(){
			var self = pub,
				f = self.osWindowFooter,
				osResizeHandle = (self.osResizeHandle = document.createElement('div'));

			osResizeHandle.className = yawd.cssClasses.osWindow.resizeHandle;
			f.appendChild(osResizeHandle);

			osResizeHandle.addEventListener('mousedown', _dragStart, false);
			document.addEventListener('mouseup', _dragEnd, false);
		},

		moveToTop: function(){
			var self = pub
				w = self.osWindow,
				z = 0;

			z = yawd.getNextZ(w.style.zIndex);			
			w.style.zIndex = z;
		},

		getTaskbar: function(){
			return yawd.open_taskbars[pub.app_id];
		},

		// used with taskbar on mouseover and mouseout
		// just calling functions from opts
		// so developers can pass in their own functions
		emphasize: function(){
			opts.emphasize(pub);
		},
		removeEmphasize: function(){
			opts.removeEmphasize(pub);
		},
		deemphasize: function(){
			opts.deemphasize(pub);
		},
		removeDeemphasize: function(){
			opts.removeDeemphasize(pub);
		},
		// need to be able to call _saveDimensions and _restoreDimensions from taskbar
		// eventually move into pub legitly
		_saveState: function(){
			_saveState();
		},
		_restoreState: function(state){
			_restoreState(state);
		}
		
	}

	// call our create function
	pub.create();

	return pub;

}

yawd.Window.defaults = {
	classes: '',
	title: 'Test App',
	footer: '',
	icon: 'imgs/icons/application.png',
	draggable: true,
	resizable: true,
	minable: true,
	maxable: true,
	closable: true,
	taskbar: true,
	height: 'auto',
	width: 600,
	height: 300,
	minHeight: 100,
	minWidth: 200,
	parent: yawd.desktop,
	id: null,
	dragDistance: 3,
	autoOpen: true,
	position: 'center',
	// used with taskbar mouseover and mouseout
	// placed here to be overriden
	emphasize: function(self){
		if(self.isMinimized){
			var w = self.osWindow,
				t = self.getTaskbar().osTaskbar;

			w.style.display = 'block'; // set up here otherwise our dimensions are off
			w.style.MozTransform = 'scale(.3)';				
			w.style.MozTransformOrigin = 'bottom center';
			w.style.opacity = '.8';
			w.style.top = 'auto';
			w.style.right = 'auto';
			w.style.bottom = '0px';
			// the middle of the window should line up with the middle of the task bar
			w.style.left = (t.offsetLeft+(t.offsetWidth/2))-(w.offsetWidth/2) + 'px';
		}
	},
	removeEmphasize: function(self){
		var w = self.osWindow;

		if(self.isMinimized){
			w.style.display = 'none';
			// self._restoreState(self.isMaximized ? 'maximized' : 'normal');
		}
	},
	deemphasize: function(self){
		var w = self.osWindow;

		yawd.addClass(w, yawd.cssClasses.osWindow.deemphasized);
	},
	removeDeemphasize: function(self){
		var w = self.osWindow;

		yawd.removeClass(w, yawd.cssClasses.osWindow.deemphasized);
	}
};