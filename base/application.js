/*
 * Hi, KITTY :) It's a simple, funny and antistress application for whole famaly. Enjoy!
 *
 * Copyright (C) 2018 Kostiantyn Korienkov <kapa76@gmail.com>
 *
 * This file is part of hi-kitty Gnome shell extension.
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

const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Soup = imports.gi.Soup;
const Lang = imports.lang;

const APPDIR = get_appdir ();
imports.searchPath.unshift(APPDIR);

const APPNAME = "Hi, KITTY :)";

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
        try {
            this.fetch ("http://thecatapi.com/api/images/get?type=gif&size=med&ts=" +
               new Date().getTime(), null,null,null);
        } catch (e) {print (e);}
    },

    build: function() {
        window.window_position = Gtk.WindowPosition.MOUSE;
        cssp = get_css_provider ();
        if (cssp) {
            Gtk.StyleContext.add_provider_for_screen (
                window.get_screen(), cssp, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }
        window.get_style_context ().add_class ("main");
        this.hb = new Gtk.HeaderBar ();
        this.hb.set_show_close_button (true);
        this.hb.title = APPNAME;
        window.set_titlebar (this.hb);
        let box = new Gtk.Box ({orientation:Gtk.Orientation.HORIZONTAL});
        window.add (box);
        this.picture = Gtk.Image.new_from_file (APPDIR + "/data/icons/get.gif");
        if (this.picture) box.pack_start (this.picture,true,true,0);

        window.connect ("focus-out-event", ()=>{app.quit();});
    },

    fetch: function (url, agent, headers, callback) {
        callback = callback || null;
        agent = agent || "Hi, KITTY:) ver." + 1;

        let session = new Soup.Session ({ user_agent: agent });
        session.use_thread_context = true;
        let request = session.request (url);
        request.send_async (null, Lang.bind (this, function (o, res) {
            try {
                let stream = request.send_finish (res);
                this.picture.pixbuf_animation = GdkPixbuf.PixbufAnimation.new_from_stream (stream, null);
                window.resize (32, 32);
            } catch (e) {print (e);}
            if (callback) callback (res);
        }));
    }
});

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
    if (GLib.file_test (s + "/prefs.js", GLib.FileTest.EXISTS)) return s;
    s = GLib.get_home_dir () + "/.local/share/gnome-shell/extensions/hikitty@konkor";
    if (GLib.file_test (s + "/prefs.js", GLib.FileTest.EXISTS)) return s;
    s = "/usr/share/gnome-shell/extensions/hikitty@konkor";
    if (GLib.file_test (s + "/prefs.js", GLib.FileTest.EXISTS)) return s;
    throw "Installation not found...";
    return s;
}

//settings = Convenience.getSettings ();

let app = new KittyApplication (ARGV);
app.run (ARGV);
