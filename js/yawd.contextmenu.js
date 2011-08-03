/*
 *	yawd ContextMenu
 *
 *	FIGURE OUT HOW TO DO CONTEXT MENU WITH SHORTCUT AND MENU ITEM WHEN MADE FROM EXISTING ELEMENTS
*/
var yawd = window.yawd || {};
yawd.ContextMenu = function(opts){

	// private variables and function
	opts = yawd.util.extend({}, yawd.ContextMenu.defaults, opts);
	
	// public variables and functions
	var pub = {
		
		isOpen: false,

		create: function(){
			var self = pub;

			var osMenu = (self.osMenu = document.createElement('menu'));
				osMenu.className = yawd.cssClasses.osContextMenu.menu;
			
			// handle the different items which were passed in
			for(var i=0; i<opts.items.length; i++){
				self.addItem(opts.items[i]);				
			}

			return self;
		},

		addItem: function(obj){
			var self = pub,
				item = document.createElement('li');

			self.osMenu.appendChild(item);
			
			if(obj.icon){
				var itemIcon = document.createElement('img');
				itemIcon.src = obj.icon;
				itemIcon.alt = obj.title;
				item.appendChild(itemIcon);
			}
			
			item.className = yawd.cssClasses.osContextMenu.item;
			item.rel = obj.action;
			item.appendChild(document.createTextNode(obj.title));
			item.addEventListener('click', function(e){ 
				e.preventDefault(); 
				e.stopPropagation(); 

				console.log(this.rel); 
			}, false);
		},

		open: function(e){
			var menu = pub.osMenu;

			menu.style.left = e.layerX + 'px';
			menu.style.top = e.layerY + 'px';
			menu.style.zIndex = yawd.getNextZ(menu.style.zIndex);
			menu.style.display = 'block';
			pub.isOpen = true;			

			document.addEventListener('click', pub.close, true);

		},

		close: function(){
			pub.osMenu.style.display = 'none';
			document.removeEventListener('click', pub.close, true);
			pub.isOpen = false;

		}
	};

	pub.create();

	return pub;
}

yawd.ContextMenu.defaults = {
	icon: 'imgs/icons/table_multiple.png',
	items: []
};