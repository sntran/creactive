/** @jsx React.DOM */
define([
  'react', 
  'scribe',
  'scribe-plugin-blockquote-command',
  'scribe-plugin-curly-quotes',
  'scribe-plugin-formatter-plain-text-convert-new-lines-to-html',
  'scribe-plugin-heading-command',
  'scribe-plugin-intelligent-unlink-command',
  'scribe-plugin-keyboard-shortcuts',
  'scribe-plugin-link-prompt-command',
  'scribe-plugin-sanitizer',
  'scribe-plugin-smart-lists',
  'scribe-plugin-toolbar'
], function (
  React, 
  Scribe,
  scribePluginBlockquoteCommand,
  scribePluginCurlyQuotes,
  scribePluginFormatterPlainTextConvertNewLinesToHtml,
  scribePluginHeadingCommand,
  scribePluginIntelligentUnlinkCommand,
  scribePluginKeyboardShortcuts,
  scribePluginLinkPromptCommand,
  scribePluginSanitizer,
  scribePluginSmartLists,
  scribePluginToolbar
) {
  "use strict";
  var ctrlKey = function (event) { return event.metaKey || event.ctrlKey; };

  var commandsToKeyboardShortcutsMap = Object.freeze({
    bold: function (event) { return event.metaKey && event.keyCode === 66; }, // b
    italic: function (event) { return event.metaKey && event.keyCode === 73; }, // i
    strikeThrough: function (event) { return event.altKey && event.shiftKey && event.keyCode === 83; }, // s
    removeFormat: function (event) { return event.altKey && event.shiftKey && event.keyCode === 65; }, // a
    linkPrompt: function (event) { return event.metaKey && ! event.shiftKey && event.keyCode === 75; }, // k
    unlink: function (event) { return event.metaKey && event.shiftKey && event.keyCode === 75; }, // k,
    insertUnorderedList: function (event) { return event.altKey && event.shiftKey && event.keyCode === 66; }, // b
    insertOrderedList: function (event) { return event.altKey && event.shiftKey && event.keyCode === 78; }, // n
    blockquote: function (event) { return event.altKey && event.shiftKey && event.keyCode === 87; }, // w
    h2: function (event) { return ctrlKey(event) && event.keyCode === 50; }, // 2
  });

  var Markdown = React.createClass({
    availableCommands: [
      "bold",
      "italic",
      "strikeThrough",
      "removeFormat",
      "linkPrompt",
      "unlink",
      "insertOrderedList",
      "insertUnorderedList",
      "indent",
      "outdent",
      "blockquote",
      "h2",
      "undo",
      "redo"
    ],
    getInitialState: function() {
      return {
        data: this.props.data
      }
    },
    componentDidMount: function() {
      var scribeElement = this.getDOMNode();
      // Create an instance of Scribe
      var scribe = new Scribe(scribeElement);
      scribe.use(scribePluginBlockquoteCommand());
      scribe.use(scribePluginHeadingCommand(2));
      scribe.use(scribePluginIntelligentUnlinkCommand());
      scribe.use(scribePluginLinkPromptCommand());
      // scribe.use(scribePluginToolbar(this.refs.toolbar.getDOMNode()));
      scribe.use(scribePluginSmartLists());
      scribe.use(scribePluginCurlyQuotes());
      scribe.use(scribePluginKeyboardShortcuts(commandsToKeyboardShortcutsMap));

      scribe.use(scribePluginSanitizer({
        tags: {
          p: {},
          br: {},
          b: {},
          strong: {},
          i: {},
          s: {},
          blockquote: {},
          ol: {},
          ul: {},
          li: {},
          a: { href: true },
          h2: {}
        }
      }));
      scribe.use(scribePluginFormatterPlainTextConvertNewLinesToHtml());

      scribe.on('content-changed', updateData);
      function updateData() {
        var html = scribe.getHTML();
        console.log(html);
      }
    },
    toMarkdown: function(html) {

    },
    handleChange: function() {
      var list = this.refs.list.getDOMNode();
      var markdown = list.innerHTML.replace(/<\/li>/mg,"\n")
               .replace(/<\/?[^>]+(>|$)/g, "")
               .replace(/^(.+)$/mg," - $1");
      this.setState({data: markdown})
    },
    render: function() {
      return (
        <div />
      )
    }
  });

  return Markdown;
});