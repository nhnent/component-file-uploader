/**
 * @fileoverview This file is about drag and drop file to send. Drag and drop is running via file api.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

var consts = require('../consts');
var utils = require('../utils');

/**
 * Makes drag and drop area, the dropped file is added via event drop event.
 * @class View.DragAndDrop
 */
var DragAndDrop = tui.util.defineClass(/** @lends View.DragAndDrop.prototype */{
    /**
     * initialize DragAndDrop
     */
    init: function(options, uploader) {
        var html = options.template && options.template.drag || consts.HTML.drag;
        this._enableClass = options.drag && options.drag.enableClass || consts.CONF.DRAG_DEFAULT_ENABLE_CLASS;
        this._render(html, uploader);
        this._addEvent();
    },

    /**
     * Renders drag and drop area
     * @param {string} html The html string to make darg zone
     * @param {object} uploader The core instance of this component
     * @private
     */
    _render: function(html, uploader) {
        this.$el = $(html);
        uploader.$el.append(this.$el);
    },

    /**
     * Adds drag and drop event
     * @private
     */
    _addEvent: function() {
        this.$el.on('dragenter', tui.util.bind(this.onDragEnter, this));
        this.$el.on('dragover', tui.util.bind(this.onDragOver, this));
        this.$el.on('drop', tui.util.bind(this.onDrop, this));
        this.$el.on('dragleave', tui.util.bind(this.onDragLeave, this));
    },

    /**
     * Handles dragenter event
     */
    onDragEnter: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this._enable();
    },

    /**
     * Handles dragover event
     */
    onDragOver: function(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    /**
     * Handles dragleave event
     */
    onDragLeave: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this._disable();
    },

    /**
     * Handles drop event
     */
    onDrop: function(e) {
        e.preventDefault();
        this._disable();
        this.fire('drop', {
            files: e.originalEvent.dataTransfer.files
        });
        return false;
    },

    _enable: function() {
        this.$el.addClass(this._enableClass);
    },

    _disable: function() {
        this.$el.removeClass(this._enableClass);
    }
});

tui.util.CustomEvents.mixin(DragAndDrop);

module.exports = DragAndDrop;