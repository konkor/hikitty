const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension ();
const APPDIR = Me.dir.get_path ();

const KittyIndicator = GObject.registerClass(class KittyIndicator extends PanelMenu.Button {

    _init () {
        super._init (0.0, "Hi, KITTY :)", false);

        this._icon = new St.Icon ({
            gicon:Gio.icon_new_for_string (APPDIR + "/data/icons/kitty.png")
        });
        this.status = new St.Icon ({style:'icon-size: 20px'});
        this.status.gicon = this._icon.gicon;
        let _box = new St.BoxLayout();
        _box.add_actor(this.status);
        this.add_actor (_box);
        this.connect ('button-press-event', () => {
            GLib.spawn_command_line_async (APPDIR + '/hi-kitty');
        });
    }
});

let kindicator;

function init () {
}

function enable () {
    kindicator = new KittyIndicator;
    Main.panel.addToStatusArea ("kitty-indicator", kindicator);
}

function disable () {
    kindicator.destroy ();
    kindicator = null;
}
