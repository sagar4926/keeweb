'use strict';

var Backbone = require('backbone'),
    FieldViewText = require('./field-view-text'),
    FieldView = require('./field-view'),
    Keys = require('../../const/keys'),
    Locale = require('../../util/locale'),
    kdbxweb = require('kdbxweb');

var FieldViewCustom = FieldViewText.extend({
    events: {
        'mousedown .details__field-label': 'fieldLabelMousedown'
    },

    initialize: function() {
        _.extend(this.events, FieldViewText.prototype.events);
    },

    startEdit: function() {
        FieldViewText.prototype.startEdit.call(this);
        if (this.model.newField && this.model.title === Locale.detAddField) {
            this.model.title = this.model.newField;
            this.$el.find('.details__field-label').text(this.model.newField);
        }
        this.$el.addClass('details__field--can-edit-title');
        if (this.isProtected === undefined) {
            this.isProtected = this.value instanceof kdbxweb.ProtectedValue;
        }
        this.protectBtn = $('<div/>').addClass('details__field-value-btn details__field-value-btn-protect')
            .toggleClass('details__field-value-btn-protect--protected', this.isProtected)
            .appendTo(this.valueEl)
            .mousedown(this.protectBtnClick.bind(this));
    },

    endEdit: function(newVal, extra) {
        this.$el.removeClass('details__field--can-edit-title');
        extra = _.extend({}, extra);
        if (this.model.titleChanged || this.model.newField) {
            extra.newField = this.model.title;
        }
        if (!this.editing) {
            return;
        }
        delete this.input;
        this.stopListening(Backbone, 'click', this.fieldValueBlur);
        if (typeof newVal === 'string') {
            newVal = $.trim(newVal);
            if (this.isProtected) {
                newVal = kdbxweb.ProtectedValue.fromString(newVal);
            }
        }
        FieldView.prototype.endEdit.call(this, newVal, extra);
        if (!newVal && this.model.newField) {
            this.model.title = Locale.detAddField;
            this.$el.find('.details__field-label').text(this.model.title);
        }
        if (this.model.titleChanged) {
            delete this.model.titleChanged;
        }
    },

    startEditTitle: function(emptyTitle) {
        var text = emptyTitle ? '' : this.model.title || '';
        this.labelInput = $('<input/>');
        this.labelEl.html('').append(this.labelInput);
        this.labelInput.attr({ autocomplete: 'off', spellcheck: 'false' })
            .val(text).focus()[0].setSelectionRange(text.length, text.length);
        this.labelInput.bind({
            input: this.fieldLabelInput.bind(this),
            keydown: this.fieldLabelKeydown.bind(this),
            keypress: this.fieldLabelInput.bind(this),
            mousedown: this.fieldLabelInputClick.bind(this),
            click: this.fieldLabelInputClick.bind(this)
        });
    },

    endEditTitle: function(newTitle) {
        if (newTitle && newTitle !== this.model.title) {
            this.model.title = newTitle;
            this.model.titleChanged = true;
        }
        this.$el.find('.details__field-label').text(this.model.title);
        delete this.labelInput;
        if (this.editing && this.input) {
            this.input.focus();
        }
    },

    fieldLabelClick: function(e) {
        e.stopImmediatePropagation();
        if (this.editing) {
            this.startEditTitle();
        } else if (this.model.newField) {
            this.edit();
            this.startEditTitle(true);
        } else {
            FieldViewText.prototype.fieldLabelClick.call(this, e);
        }
    },

    fieldLabelMousedown: function(e) {
        if (this.editing) {
            e.stopPropagation();
        }
    },

    fieldValueBlur: function() {
        if (this.labelInput) {
            this.endEditTitle(this.labelInput.val());
        }
        if (this.input) {
            this.endEdit(this.input.val());
        }
    },

    fieldLabelInput: function(e) {
        e.stopPropagation();
    },

    fieldLabelInputClick: function(e) {
        e.stopPropagation();
    },

    fieldLabelKeydown: function(e) {
        e.stopPropagation();
        var code = e.keyCode || e.which;
        if (code === Keys.DOM_VK_RETURN) {
            this.endEditTitle(e.target.value);
        } else if (code === Keys.DOM_VK_ESCAPE) {
            this.endEditTitle();
        } else if (code === Keys.DOM_VK_TAB) {
            e.preventDefault();
            this.endEditTitle(e.target.value);
        }
    },

    fieldValueInputClick: function() {
        if (this.labelInput) {
            this.endEditTitle(this.labelInput.val());
        }
        FieldViewText.prototype.fieldValueInputClick.call(this);
    },

    protectBtnClick: function(e) {
        e.stopPropagation();
        this.isProtected = !this.isProtected;
        this.protectBtn.toggleClass('details__field-value-btn-protect--protected', this.isProtected);
        if (this.labelInput) {
            this.endEditTitle(this.labelInput.val());
        }
        this.setTimeout(function() { this.input.focus(); });
    }
});

module.exports = FieldViewCustom;
