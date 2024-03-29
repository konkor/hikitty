/*
 * Hi, KITTY :) It's a simple, funny and antistress application for whole famaly. Enjoy!
 *
 * Copyright (C) 2018 Kostiantyn Korienkov <kapa76@gmail.com>
 *
 * This file is part of hi-kitty appllication.
 *
 * hi-kitty is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * hi-kitty is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

imports.gi.versions.Gtk  = "3.0";
imports.gi.versions.Soup = "3.0";

const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Soup = imports.gi.Soup;
const Lang = imports.lang;

var Format = imports.format;
String.prototype.format = Format.format;

const APPDIR = get_appdir ();
imports.searchPath.unshift(APPDIR);

const APPNAME = "Hi, KITTY :)";

const API = "http://thecatapi.com/api/images/get?type=%s&size=%s&ts=%d";
var image_type = "gif";
var image_size = "med";

let cached = GLib.get_tmp_dir () + "/cached.gif"
let theme_gui = APPDIR + "/data/theme/gtk.css";
let cssp = null;
let settings = null;
let window = null;

var KittyApplication = new Lang.Class ({
    Name: "KittyApplication",
    Extends: Gtk.Application,

    _init: function (args) {
        GLib.set_prgname (APPNAME);
        this.parent ({
            application_id: "org.konkor.kitty.application",
            flags: Gio.ApplicationFlags.HANDLES_OPEN
        });
        GLib.set_application_name ("hi-kitty");
    },

    vfunc_startup: function() {
        this.parent();
        window = new Gtk.Window ();
        window.set_icon_name ("org.konkor.kitty");
        if (!window.icon) try {
            window.icon = Gtk.Image.new_from_file (APPDIR + "/data/icons/kitty.svg").pixbuf;
        } catch (e) {
            error (e);
        }
        this.add_window (window);

        this.build ();
    },

    vfunc_activate: function() {
        window.connect("destroy", () => {});
        window.show_all ();
        window.present ();
        this.update ();
    },

    update: function() {
        try { fetch (new_image_url (), null,null, () => {
            this.picture.pixbuf_animation = GdkPixbuf.PixbufAnimation.new_from_file (cached);
          });
        } catch (e) {print (e);}
    },

    build: function() {
        this.build_menu ();
        window.window_position = Gtk.WindowPosition.MOUSE;
        cssp = get_css_provider ();
        if (cssp) {
            Gtk.StyleContext.add_provider_for_screen (
                window.get_screen(), cssp, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }
        window.get_style_context ().add_class ("main");
        this.hb = new Gtk.HeaderBar ();
        this.hb.set_show_close_button (false);
        this.hb.title = APPNAME;
        window.set_titlebar (this.hb);
        let box = new Gtk.Box ({orientation:Gtk.Orientation.HORIZONTAL});
        window.add (box);
        let ebox = new Gtk.EventBox ();
        box.pack_start (ebox,true,true,0);
        this.picture = Gtk.Image.new_from_file (APPDIR + "/data/icons/get.gif");
        if (this.picture) ebox.add (this.picture);

        window.connect ("focus-out-event", () => { if (!this.menu.visible) app.quit(); });
        ebox.connect ("button-press-event", (o, event) => {
            let [,button] = event.get_button();
            if (button == 3)
              this.menu.popup_at_widget (o, Gdk.Gravity.NORTH, Gdk.Gravity.EAST, event);
        });
    },

    build_menu: function () {
        this.menu = new Gtk.Menu ();
        let mi = Gtk.MenuItem.new_with_label ("Update");
        mi.tooltip_text = "Get a new one kitty!";
        this.menu.add (mi);
        mi.connect ("activate", (o) => {
          this.update ();
        });
        this.menu.add (new Gtk.SeparatorMenuItem ());
        mi = Gtk.MenuItem.new_with_label ("Save");
        mi.tooltip_text = "Save the kitty!";
        this.menu.add (mi);
        mi.connect ("activate", this.save.bind (this));

        this.menu.show_all ();
    },

    save: function (o) {
        let dlg = new Gtk.FileChooserDialog ({
            title:"Select your filename", parent:window, action:Gtk.FileChooserAction.SAVE
        });
        dlg.add_button ("_Cancel", Gtk.ResponseType.CANCEL);
        dlg.add_button ("_Save", Gtk.ResponseType.OK);
        dlg.set_current_folder (GLib.get_user_special_dir (GLib.UserDirectory.DIRECTORY_PICTURES));
        dlg.set_current_name ("kitty.gif");
        if (dlg.run () == Gtk.ResponseType.OK) {
            let filename = dlg.get_filename ();
            let i = 0, fn = filename;
            if (GLib.file_test (filename, GLib.FileTest.EXISTS))
              while (GLib.file_test (fn, GLib.FileTest.EXISTS)) {
                fn = filename.substring (0,filename.lastIndexOf (".")) + "_" + i + ".gif";
                i++;
              }
            filename = fn;
            let tmp = Gio.File.new_for_path (cached);
            tmp.copy (Gio.File.new_for_path (filename), 0, null, null);
        }
    }
});


function fetch (url, agent, headers, callback) {
    callback = callback || null;
    agent = agent || "Hi, KITTY:) ver." + 1;

    let session = new Soup.Session ();
    session.user_agent = agent;
    //Soup.Session.prototype.add_feature.call (session, new Soup.ProxyResolverDefault());
    let request = Soup.Message.new ("GET", url);
    if (headers) headers.forEach ( h => {
      request.request_headers.append (h[0], h[1]);
    });
    try {
      session.send_and_read_async (request, 100, null, (session, res) => {
        let response = session.send_and_read_finish (res);
        if (response) {
          let data = response.get_data ();
          if (data) GLib.file_set_contents (cached, data);
          if (callback) callback (data);
        };
      });
    } catch (e) {
      error ("fetch", `Error making HTTP request: ${e.message}`);
    }
}

function new_image_url () {
    return API.format (image_type, image_size, new Date().getTime());
}

function get_css_provider () {
    let cssp = new Gtk.CssProvider ();
    let css_file = Gio.File.new_for_path (theme_gui);
    try {
        cssp.load_from_file (css_file);
    } catch (e) {
        print (e);
        cssp = null;
    }
    return cssp;
}

function getCurrentFile () {
    let stack = (new Error()).stack;
    let stackLine = stack.split("\n")[1];
    if (!stackLine)
        throw new Error ("Could not find current file");
    let match = new RegExp ("@(.+):\\d+").exec(stackLine);
    if (!match)
        throw new Error ("Could not find current file");
    let path = match[1];
    let file = Gio.File.new_for_path (path).get_parent();
    return [file.get_path(), file.get_parent().get_path(), file.get_basename()];
}

function get_appdir () {
    let s = getCurrentFile ()[1];
    if (GLib.file_test (s + "/hi-kitty", GLib.FileTest.EXISTS)) return s;
    s = GLib.get_home_dir () + "/.local/share/gnome-shell/extensions/hikitty@konkor";
    if (GLib.file_test (s + "/hi-kitty", GLib.FileTest.EXISTS)) return s;
    s = "/usr/share/gnome-shell/extensions/hikitty@konkor";
    if (GLib.file_test (s + "/hi-kitty", GLib.FileTest.EXISTS)) return s;
    throw "Installation not found...";
    return s;
}

//settings = Convenience.getSettings ();

let app = new KittyApplication (ARGV);
app.run (ARGV);
