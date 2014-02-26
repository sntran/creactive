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
        this.props.onAddBlock({type: type, data: ""}, this.props.newIdx);
    },
    createBlockOption: function(type) {
        return (
            <a key={uuid()} href="#" onClick={this.addBlock}>
                {type}
            </a>
        )
    },
    render: function() {
        var adderStyles = {
            fontSize: "3em",
            textDecoration: "none"
        }
        return (
            <div onClick={this.showAvailableBlocks} style={{textAlign: "center"}}>
                <a href="#" style={adderStyles}>+</a>
                <div style={{display: this.state.display}}>
                    {this.props.blocks.map(this.createBlockOption)}
                </div>
            </div>
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
var Reactor = React.createClass({
    getInitialState: function() {
        return {blocks: []};
    },
    componentWillMount: function() {
        this.setState({blocks: this.props.initialData}, function() {
            // The Editor finished rendering, focus?
        });
    },
    updateBlockData: function(idx, data) {
        var newBlocks = this.state.blocks;
        newBlocks[idx].data = data;
        this.setState({blocks: newBlocks});
    },
    addBlock: function(blockData, idx) {
        var newBlocks = this.state.blocks;
        newBlocks.splice(idx, 0, blockData);
        this.setState({blocks: newBlocks});
    },
    createBlock: function(blockData, idx) {
        return (
            <div className="reactor-block" key={uuid()}>
                {window[blockData.type]({
                    idx: idx, key: uuid(),
                    data: blockData.data,
                    toData: this.updateBlockData.bind(this, idx)})}
                <a href="#" onClick={this.removeBlock.bind(this, idx)}>Remove</a>
                <ReactorControls blocks={this.props.blockTypes} onAddBlock={this.addBlock} newIdx={idx+1} />
            </div>
        );
    },
    removeBlock: function(idx) {
        var newBlocks = this.state.blocks;
        newBlocks.splice(idx, 1);
        this.setState({blocks: newBlocks});
    },
    render: function() {
        return (
            <div className="reactor">
                <ReactorControls blocks={this.props.blockTypes} onAddBlock={this.addBlock} newIdx={0} />
                {this.state.blocks.map(this.createBlock)}
            </div>
        );
    }
});

// Support touch on mobile devices.
React.initializeTouchEvents(true);

var entry = document.getElementById('markdown-entry');
var initialData = [{type:"Text", data: entry.value}];
var reactor = document.createElement("div");
entry.parentNode.insertBefore(reactor, entry);
entry.style.display = "none";

React.renderComponent(
    <Reactor initialData={initialData} blockTypes={["Text", "Image"]}/>, 
    reactor
);