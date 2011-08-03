/*
 *	yawd.Dialog
 *	specialized implamentation of osWindow
 *	this actually just combines the proper things and then returns a window object
*/
var yawd = window.yawd || {};
yawd.Dialog = function(content, opts, app_id, target){

	// private variables
	opts = yawd.util.extend({}, yawd.Dialog.defaults, opts);

	// private functions
	function findosParent(t){
		if(yawd.hasClass(t, 'yawd-window') || yawd.hasClass(t, 'yawd-desktop'))
			return t
		else
			return findosParent(t.parentNode);

	}

	var pub = {
		
		create: function(){
			var self = pub;

			// if modal setup the overlay
			if(opts.modal == true){
				var overlay = (self.overlay = document.createElement('div'));
					overlay.className = 'yawd-overlay';
					overlay.style.zIndex = yawd.getNextZ(overlay.style.zIndex);
					
				if(target){
					var osParent = findosParent(target);
				} else {
					var osParent = document.body;
				}
				osParent.appendChild(overlay);
				
				opts.parent = osParent;
			
			} else {
				// if it's system wide make sure it has a task bar
				console.log(target);
				if(!target)
					opts.taskbar = true;
				else
					opts.taskbar = false;
			}

			var element = document.createElement('div');
				yawd.addClass(element, yawd.cssClasses.osDialog.holder);

			// add the string of html into the holder
			element.innerHTML = content;
			
			var btnHolder = document.createElement('div');
				yawd.addClass(btnHolder, yawd.cssClasses.osDialog.btnHolder);

			// setup and call the window here so that the btn callbacks can be scoped to the window
			var w = yawd.openWindow(element, opts);

			// loop through to create and add the buttons to btn holder
			for(var i=0; i<opts.buttons.length; i++){
				var btn = document.createElement('button');
					yawd.addClass(btn, yawd.cssClasses.osDialog.button);
					btn.appendChild(document.createTextNode(opts.buttons[i].name));

					btn.addEventListener(
						'click', 
						opts.buttons[i].action.bind(w),
						false
					);

				btnHolder.appendChild(btn);
			}

			// add button holder to the element
			element.appendChild(btnHolder);

			// if its modal, setup a close callback
			if(opts.modal == true){
				w.osWindow.addEventListener('close',
					function(){
						self.overlay.parentNode.removeChild(overlay);
					},
					true
				);
			}


			// open the window
			w.open();
			
		}
	}

	// call our create function
	pub.create();

}

yawd.Dialog.defaults = {
	classes: '',
	title: 'Alert',
	footer: '',
	autoOpen: false,
	icon: 'imgs/icons/application.png',
	draggable: true,
	resizable: true,
	minable: false,
	maxable: false,
	closable: false,
	modal: false,
	height: 125,
	width: 300,
	minHeight: 100,
	minWidth: 200,
	buttons:[{
		name: "Ok",
		action: function(e){
			this.close();
		}
	}]
}