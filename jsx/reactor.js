/** @jsx React.DOM */
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
var ReactorControls = React.createClass({
    getInitialState: function() {
        return {display: 'none'};
    },
    showAvailableBlocks: function() {
        this.setState({display: this.state.display === 'none' ? 'block' : 'none'});
    },
    addBlock: function(e) {
        var type = e.target.text;
        this.props.onAddBlock({type: type, data: ""});
    },
    createBlockOption: function(blockDef) {
        return (
            <a key={uuid()} className="reactor-control" href="#" onClick={this.addBlock}>
                {blockDef.type}
            </a>
        )
    },
    render: function() {
        return (
            <div onClick={this.showAvailableBlocks}>
                <div style={{display: this.state.display}}>
                    {this.props.blocks.map(this.createBlockOption)}
                </div>
                +
            </div>
        )
    }
});

var BlockContainer = React.createClass({
    destroy: function() {
        this.props.onRemoved(this.props.idx);
    },
    render: function() {
        var props = this.props;
        return (
            <div className="reactor-block">
                {window[props.type]({initialData: props.data})}
                <a href="#" onClick={this.moveBlock}>Move</a>
                <a href="#" onClick={this.destroy}>Remove</a>
            </div>
        );
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
var Reactor = React.createClass({
    blockTypes: [{type: "Text"}],
    getInitialState: function() {
        return {blocks: []};
    },
    componentWillMount: function() {
        this.setState({blocks: this.props.blocks}, function() {
            // The Editor finished rendering, focus?
        });
    },
    addBlock: function(blockData) {
        var blocks = this.state.blocks.concat([blockData]);
        this.setState({blocks: blocks});
    },
    createBlock: function(blockData, idx) {
        return <BlockContainer 
                    key = {uuid()} idx = {idx}
                    type = {blockData.type} 
                    data = {blockData.data}
                    onRemoved = {this.removeBlock} />
    },
    removeBlock: function(idx) {
        var newBlocks = this.state.blocks;
        newBlocks.splice(idx, 1);
        this.setState({blocks: newBlocks});
    },
    render: function() {
        return (
            <div className="reactor">
                <ReactorControls blocks={this.blockTypes} onAddBlock={this.addBlock} />
                {this.state.blocks.map(this.createBlock)}
            </div>
        );
    }
});

// Support touch on mobile devices.
React.initializeTouchEvents(true);

var entry = document.getElementById('markdown-entry');
var blocks = [{type:"Text", data: entry.value}];
var reactor = document.createElement("div");
entry.parentNode.insertBefore(reactor, entry);
entry.style.display = "none";
React.renderComponent(<Reactor blocks={blocks} />, reactor);