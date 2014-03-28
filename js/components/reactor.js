/** @jsx React.DOM */
require.config({
  paths: {
    'react': '/js/vendor/react-with-addons-0.10.0',
    'scribe': '/js/vendor/scribe/scribe',
    'scribe-plugin-blockquote-command': '/js/vendor/scribe-plugin-blockquote-command/scribe-plugin-blockquote-command',
    'scribe-plugin-curly-quotes': '/js/vendor/scribe-plugin-curly-quotes/scribe-plugin-curly-quotes',
    'scribe-plugin-formatter-plain-text-convert-new-lines-to-html': '/js/vendor/scribe-plugin-formatter-plain-text-convert-new-lines-to-html/scribe-plugin-formatter-plain-text-convert-new-lines-to-html',
    'scribe-plugin-heading-command': '/js/vendor/scribe-plugin-heading-command/scribe-plugin-heading-command',
    'scribe-plugin-intelligent-unlink-command': '/js/vendor/scribe-plugin-intelligent-unlink-command/scribe-plugin-intelligent-unlink-command',
    'scribe-plugin-keyboard-shortcuts': '/js/vendor/scribe-plugin-keyboard-shortcuts/scribe-plugin-keyboard-shortcuts',
    'scribe-plugin-link-prompt-command': '/js/vendor/scribe-plugin-link-prompt-command/scribe-plugin-link-prompt-command',
    'scribe-plugin-sanitizer': '/js/vendor/scribe-plugin-sanitizer/scribe-plugin-sanitizer',
    'scribe-plugin-smart-lists': '/js/vendor/scribe-plugin-smart-lists/scribe-plugin-smart-lists',
    'scribe-plugin-toolbar': '/js/vendor/scribe-plugin-toolbar/scribe-plugin-toolbar'
  }
});

require(['react', 'blocks/wysiwyg', 'blocks/list'], function (React, TextBlock, ListBlock) {
    "use strict";

    function uuid() {
        // http://www.ietf.org/rfc/rfc4122.txt
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        var uuid = s.join("");
        return uuid;
    }

    /**
     * Controls component to render the + button between each block.
     * @constructor
     *
     * Once clicked, it shows a list of available block types, defined in
     * its `props`. Each option, once clicked, will trigger the handler of
     * the editor to add a new block.
     */
    var ReactorControls = React.createClass({displayName: 'ReactorControls',
        CONTROLS: {
            LIST: "",
            ADD: "+",
            DROP: "Drop Block Here"
        },
        getInitialState: function() {
            return {control: this.CONTROLS.ADD};
        },
        showAvailableBlocks: function() {
            this.setState({control: this.CONTROLS.LIST});
        },
        addBlock: function(e) {
            var type = e.target.text;
            this.props.onAddBlock({type: type, data: ""});
        },
        handleDragEnter: function(e) {
            /* dispatched when another component is dragged over this component. */
            /* Most areas of a web page or application are not valid places to drop data.
            Thus, the default handling for these events is to not allow a drop.
            We prevent the default handling by cancelling the event so we can drop */
            e.preventDefault(); // Necessary. Allows us to drop.
            this.setState({control: this.CONTROLS.DROP});
        },
        handleDragLeave: function() {
            /* dispatched when the other component is dragged outside this component. */
            this.setState({control: this.CONTROLS.ADD});
        },
        handleDragOver: function(e) {
            /* dispatched when another component is moved inside this component. */
            /* Most areas of a web page or application are not valid places to drop data.
            Thus, the default handling for these events is to not allow a drop.
            We prevent the default handling by cancelling the event so we can drop */
            e.preventDefault(); // Necessary. Allows us to drop.
            e.dataTransfer.dropEffect = 'move';
            return false;
        },
        createBlockOption: function(type) {
            return (
                React.DOM.a( {key:uuid(), href:"#", onClick:this.addBlock}, 
                    type
                )
            )
        },
        render: function() {
            var state = this.state, CONTROLS = this.CONTROLS;
            var blockStyles = {
                textAlign: "center",
                border: (state.control == CONTROLS.DROP)? "2px dashed #000" : "none"
            }
            var adderStyles = {
                fontSize: "3em",
                textDecoration: "none",
                cursor: "pointer"
            }
            return (
                React.DOM.div( {onClick:this.showAvailableBlocks, 
                    onDragOver:this.handleDragOver,
                    onDragEnter:this.handleDragEnter,
                    onDragLeave:this.handleDragLeave,
                    style:blockStyles}
                , 
                    React.DOM.span( {style:adderStyles}, state.control),
                    React.DOM.div( {style:{display: (state.control === CONTROLS.LIST)? "block":"none"}}, 
                        this.props.blockTypes.map(this.createBlockOption)
                    )
                )
            )
        }
    });

    function getPos(ele){
        var x=0;
        var y=0;
        while(true){
            x += ele.offsetLeft;
            y += ele.offsetTop;
            if(ele.offsetParent === null){
                break;
            }
            ele = ele.offsetParent;
        }
        return [x, y];
    }

    var Draggable = React.createClass({displayName: 'Draggable',
        handleDragStart: function(e) {
            e.dataTransfer.effectAllowed = "move";
            var blockNode = this.getDOMNode();
            var btn = e.currentTarget.parentNode;
            var pos = getPos(btn);
            e.dataTransfer.setDragImage(blockNode, pos[0], pos[1]);
            // We store the index of the block being dragged.
            e.dataTransfer.setData('text/idx', this.props.idx);
        },
        handleDragEnd: function() {

        },
        handleDrop: function(e) {
            // The target block - the block being dragged onto - will receive `drop` event.
            e.stopPropagation();
            var droppeeIdx  = parseInt(e.dataTransfer.getData('text/idx'));
            this.props.onBeingDropped(droppeeIdx);
            return false;
        },
        render: function() {
            var state = this.state;
            return (
                React.DOM.div( {className:"draggable",
                    onDragStart:this.handleDragStart,
                    onDragEnd:this.handleDragEnd,
                    onDrop:this.handleDrop}
                , 
                    this.props.children
                )
            )
        }
    });

    /**
     * The main component for the editor
     * @constructor
     *
     * Renders blocks based on the data provided in the DOM node's text.
     * It also renders various controls for block such as adding a new block,
     * deleting an existing block, and changing the order of blocks.
     */
    var Reactor = React.createClass({displayName: 'Reactor',
        getInitialState: function() {
            return {blocks: []};
        },
        componentWillMount: function() {
            this.setState({blocks: this.props.initialData}, function() {
                // The Editor finished rendering, focus?
            });
        },
        updateBlock: function(idx, newBlockData) {
            var newBlocks = this.state.blocks;
            newBlocks[idx].data = newBlockData;
            this.setState({blocks: newBlocks});
        },
        addBlock: function(idx, blockData) {
            var block = this.refs['block-'+idx];
            var newBlocks = this.state.blocks;
            newBlocks.splice(idx, 0, blockData);
            this.setState({blocks: newBlocks});
        },
        swapBlock: function(targetIdx, sourceIdx) {
            var blocks = this.state.blocks;
            var temp = blocks[sourceIdx];
            blocks[sourceIdx] = blocks[targetIdx];
            blocks[targetIdx] = temp;
            this.setState({blocks: blocks});
        },
        removeBlock: function(idx) {
            var newBlocks = this.state.blocks;
            newBlocks.splice(idx, 1);
            this.setState({blocks: newBlocks});
        },
        renderBlock: function(blockData, idx) {
            return (
                Draggable( {key:uuid(), onBeingDropped:this.swapBlock.bind(this, idx)}, 
                    ReactorControls( 
                        {blockTypes:this.props.blockTypes, 
                        onAddBlock:this.addBlock.bind(this, idx)} 
                    ),
                    Reactor.Blocks[blockData.type]({
                        ref: 'block',
                        data: blockData.data,
                        onData: this.updateBlock.bind(this, idx)
                    }),
                    React.DOM.a( {href:"#", onClick:this.removeBlock.bind(this, idx)}, "Remove"),
                    React.DOM.a( {href:"#", draggable:true, onClick:this.displayPositioner}, "Reorder")
                )
            );
        },
        render: function() {
            var blocks = this.state.blocks, total = blocks.length;
            return (
                React.DOM.div( {className:"reactor"}, 
                    blocks.map(this.renderBlock),
                    ReactorControls( {blockTypes:this.props.blockTypes, onAddBlock:this.addBlock.bind(this, total)})
                )
            );
        }
    });

    Reactor.Blocks = {
        "Text": TextBlock,
        "List": ListBlock
    }

    // Support touch on mobile devices.
    React.initializeTouchEvents(true);

    var entry = document.getElementById('markdown-entry');
    var initialData = [{type:"Text", data: entry.value}, {type: "List", data: " - Item 1\n - Item 2"}];
    var reactor = document.createElement("div");
    entry.parentNode.insertBefore(reactor, entry);
    entry.style.display = "none";

    React.renderComponent(
        Reactor( {initialData:initialData, blockTypes:["Text", "List"]}), 
        reactor
    );
});