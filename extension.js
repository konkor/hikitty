const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension ();
const APPDIR = Me.dir.get_path ();

const KittyIndicator = new Lang.Class({
    Name: "KittyIndicator",
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent (0.0, "Hi, KITTY :)", false);

        this._icon = new St.Icon ({
            gicon:Gio.icon_new_for_string (APPDIR + "/data/icons/kitty.png")
        });
        this.status = new St.Icon ({style:'icon-size: 20px'});
        this.status.gicon = this._icon.gicon;
        let _box = new St.BoxLayout();
        _box.add_actor(this.status);
        this.actor.add_actor (_box);
        this.actor.connect('button-press-event', Lang.bind(this, function () {
            GLib.spawn_command_line_async (APPDIR + '/hi-kitty');
        }));
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
    kindicator.remove_events ();
    kindicator.destroy ();
    kindicator = null;
}
