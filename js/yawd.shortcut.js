/*
 *	yawd Shoartcut
 *
*/
var yawd = window.yawd || {};
yawd.Shortcut = function(opts, alignTo, el){

	// private variables and function
	opts = yawd.util.extend({}, yawd.Shortcut.defaults, opts);
	
	// draggable
	var _allowDrag = false,
		_mousedownEvent = {},
		_dragOffset = {};
	function _mouseDistanceMet(e){
		if(_allowDrag)
			return true;

		return _allowDrag = (Math.max(
				Math.abs(_mousedownEvent.pageX - e.pageX),
				Math.abs(_mousedownEvent.pageY - e.pageY)
			) >= 3
		);
	}
	function _makeDraggable(e){
		var s = pub.osShortcut;		
		s.addEventListener('mousedown', _dragStart, false);
		document.addEventListener('mouseup', _dragEnd, false);
	}
	function _dragStart(e){
		var self = pub,
			s = self.osShortcut;

		// keep firefox from the default actions
		e.preventDefault();

		// save the offset of mouse vs window
		_dragOffset = {
			top: e.clientY - s.offsetTop,
			left: e.clientX - s.offsetLeft
		};
		_mousedownEvent = e;
		
		document.addEventListener('mousemove', _dragCheck, false);
		yawd.addClass(s, yawd.cssClasses.misc.dragging);
		self.autoPositioned = false;
	}
	function _dragCheck(e){
		if(_allowDrag){
			_dragShortcut(e);
		} else {
			if(_mouseDistanceMet(e)){
				_dragShortcut(e);
			}
		}
	}
	function _dragEnd(e){
		var self = pub,
			s = self.osShortcut;		
		// remove drag class
		yawd.removeClass(s, yawd.cssClasses.misc.dragging);		
		yawd.removeClass(s, yawd.cssClasses.osShortcut.highlight);

		// remove the mousemove event from window
		document.removeEventListener('mousemove', _dragCheck, false);
		_allowDrag = false;
		_dragOffset = null;
		_dragEvent = null;
	}
	function _dragShortcut(e){
		var self = pub,
			s = self.osShortcut;

		s.style.top = e.clientY - _dragOffset.top + 'px';
		s.style.left = e.clientX - _dragOffset.left + 'px';
	}
	
	// public variables and functions
	var pub = {

		autoPositioned: true,
		
		createFromScratch: function(){
			var self = pub;

			var osShortcut = (self.osShortcut = document.createElement('a'));
				yawd.desktop.appendChild(osShortcut);
				yawd.addClass(osShortcut, yawd.cssClasses.osShortcut.main);

				// add the icon
				var osIcon = document.createElement('img');
					osIcon.src = opts.icon;
					osIcon.alt = opts.title;
					osIcon.className = yawd.cssClasses.osShortcut.icon;
					osShortcut.appendChild(osIcon);

				// add the title
				var osLabel = document.createElement('label');
					osLabel.appendChild(document.createTextNode(opts.title));
					osShortcut.appendChild(osLabel);


			// handle any context menus
			if(opts.contextMenu.items.length){
				var cm = new yawd.ContextMenu(opts.contextMenu);
				osShortcut.appendChild(cm.osMenu);

				osShortcut.addEventListener(
					'contextmenu',
					function(e){
						cm.open(e);

						e.preventDefault();
						e.stopPropagation();
					},
					false
				);
			}

				
			// track if it's auto positioned
			if(opts.position !== 'auto')
				self.autoPositioned = false;

			// position it
			self.doPosition();

			_makeDraggable();

			// event listeners
			osShortcut.addEventListener('mouseover', self.handleMouseover, false);
			osShortcut.addEventListener('mouseout', self.handleMouseout, false);
			osShortcut.addEventListener('click', self.handleClick, false);
			osShortcut.addEventListener('dblclick', self.handleDblclick, false);			
		},

		createFromElement: function(){
			var self = pub;

			// add some classes to what's already there and whatnot
			var osShortcut = (self.osShortcut = el);
				yawd.addClass(osShortcut, yawd.cssClasses.osShortcut.main);
			
			var osIcon = el.getElementsByTagName('img')[0];
				yawd.addClass(osIcon, yawd.cssClasses.osShortcut.icon);

			// track if it's auto positioned
			if(opts.position !== 'auto')
				self.autoPositioned = false;

			// position it
			self.doPosition();

			_makeDraggable();

			// event listeners
			osShortcut.addEventListener('mouseover', self.handleMouseover, false);
			osShortcut.addEventListener('mouseout', self.handleMouseout, false);
			osShortcut.addEventListener('click', self.handleClick, false);
			osShortcut.addEventListener('dblclick', self.handleDblclick, false);
			
		},

		doPosition: function(){
			var s = pub.osShortcut;

			s.style[alignTo] = opts.x + 'px';
			s.style.top = opts.y + 'px';
		},
		
		getOptions: function(){
			var s = pub.osShortcut;
			return yawd.util.extend(opts, {
				position: pub.autoPositioned ? 'auto' : '',
				x: s.offsetLeft,
				y: s.offsetTop
			});
		},
		
		handleMouseover: function(e){
			var s = pub.osShortcut;
			yawd.addClass(s, yawd.cssClasses.osShortcut.hover);
		},

		handleMouseout: function(e){
			var s = pub.osShortcut;
			yawd.removeClass(s, yawd.cssClasses.osShortcut.hover);
		},
		
		handleClick: function(e){
			var s = pub.osShortcut;
			e.preventDefault();

			if(yawd.hasClass(s, yawd.cssClasses.osShortcut.highlight))
				yawd.removeClass(s, yawd.cssClasses.osShortcut.highlight);
			else
				yawd.addClass(s, yawd.cssClasses.osShortcut.highlight);
		},

		handleDblclick: function(){
			var s = pub.osShortcut;
			yawd.removeClass(s, yawd.cssClasses.osShortcut.highlight);

			// figure out a better way for actions
			if(yawd.util.isArray(opts.action)){
				if(yawd.util.isFunction(yawd[opts.action[0]]))
					yawd[opts.action[0]].apply(pub, opts.action[1]);
				
			} else if(yawd.util.isFunction(opts.action)){
				opts.action.apply(this);
			} else if(yawd.util.isFunction(yawd[opts.action])){
				yawd[opts.action].apply(yawd);
			} else {
				console.log(opts.action);
			}
		}
	};

	if(el == null)
		pub.createFromScratch();
	else
		pub.createFromElement();

	return pub;
}

yawd.Shortcut.defaults = {
	icon: null,
	appIcon: null,
	action: null,
	title: 'untitled',
	position: '',
	x: null,
	y: null,
	contextMenu: {
		items: [
			{
				title: 'Remove Shortcut',
				icon: 'imgs/icons/delete.png',
				action: 'delete'
			},
			{
				title: 'Edit Film',
				icon: 'imgs/icons/film_edit.png',
				action: 'editFilm'
			}

		]
	}
};