/*
 *	yawd MenuItem
 *
*/
var yawd = window.yawd || {};
yawd.MenuItem = function(opts, el){

	// private variables and function
	opts = yawd.util.extend({}, yawd.MenuItem.defaults, opts);
	
	// public variables and functions
	var pub = {
		
		createFromScratch: function(){
			var self = pub;

			var osMenuItem = (self.osMenuItem = document.createElement('li'));
				yawd.menu.appendChild(osMenuItem);
				osMenuItem.className = yawd.cssClasses.osMenuItem.main;

				var osIcon = document.createElement('img');
					osIcon.src = opts.icon;
					osIcon.alt = opts.title;
					osMenuItem.appendChild(osIcon);

				osMenuItem.appendChild(document.createTextNode(opts.title));

			
			// add submenu items
			if(opts.items !== false){
				// add a hasSub class to the li
				yawd.addClass(osMenuItem, yawd.cssClasses.osMenuItem.hasSub);
				var osSubMenu = document.createElement('menu');
				osSubMenu.className = yawd.cssClasses.osMenuItem.menu;
				osMenuItem.appendChild(osSubMenu);

				for(i in opts.items){
					var t = new yawd.MenuItem(opts.items[i]);
					osSubMenu.appendChild(t.osMenuItem);
				}
			}

			// handle any context menus
			if(opts.contextMenu.items.length && opts.items == false){
				var cm = new yawd.ContextMenu(opts.contextMenu);
				osMenuItem.appendChild(cm.osMenu);

				osMenuItem.addEventListener(
					'contextmenu',
					function(e){
						cm.open(e);
						e.preventDefault();
						e.stopPropagation();
					},
					true
				);
			} else {
				osMenuItem.addEventListener(
					'contextmenu',
					function(e){
						e.preventDefault();
					},
					true
				);
			}

			// setup event handlers
			osMenuItem.addEventListener('mouseover', self.handleMouseover, false);
			osMenuItem.addEventListener('mouseout', self.handleMouseout, false);
			// only add click if there's an action
			if(opts.action !== false)
				osMenuItem.addEventListener('click', self.handleClick, false);
										
		},

		createFromElement: function(){
			var self = pub;

			opts.title = el.firstChild.alt;
			if(el.attributes.rel)
				opts.action = el.attributes.rel.nodeValue;

			var osMenuItem = (self.osMenuItem = el);
				yawd.addClass(osMenuItem, yawd.cssClasses.osMenuItem.main);
			
			// setup event handlers
			osMenuItem.addEventListener('mouseover', self.handleMouseover, false);
			osMenuItem.addEventListener('mouseout', self.handleMouseout, false);
			// only add click if there's an action
			if(opts.action !== false)
				osMenuItem.addEventListener('click', self.handleClick, false);

			// check children for submenus
			if(el.childElementCount){
				for(var i in el.children){
					if(el.children[i].nodeName == 'MENU'){
						yawd.addClass(el, yawd.cssClasses.osMenuItem.hasSub);
						for(var j in el.children[i].children){
							if(el.children[i].children[j].nodeName=='LI'){
								new yawd.MenuItem({}, el.children[i].children[j]);
							}
						}
					}
				}
			}
			
		},
		
		handleMouseover: function(e){
			var m = pub.osMenuItem;
			yawd.addClass(m, yawd.cssClasses.osMenuItem.hover);
		},

		handleMouseout: function(e){
			var m = pub.osMenuItem;
			yawd.removeClass(m, yawd.cssClasses.osMenuItem.hover);
		},
		
		handleClick: function(e){
			e.preventDefault();

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

			// hide the menu
			// if(yawd.menuTrigger)
			//	yawd.trigger('click', yawd.menuTrigger);
		}
	};

	if(el == null)
		pub.createFromScratch();
	else
		pub.createFromElement();

	return pub;
}

yawd.MenuItem.defaults = {
	icon: null,
	action: false,
	title: 'untitled',
	items : false,
	contextMenu: {
		items: [
			{
				title: 'Add To Desktop',
				icon: 'imgs/icons/shape_square_add.png',
				action: 'addToDesktop'
			}
		]
	}
};