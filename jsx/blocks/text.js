/** @jsx React.DOM */
var Text = React.createClass({
    propTypes: {
        data: React.PropTypes.string,
        html: React.PropTypes.string
    },
    getDefaultProps: function() {
        return {
            data: ""
        }
    },
    getInitialState: function() {
        var data = this.props.initialData;
        return { 
            data: data, 
            html: marked(data), 
            previewing: false
        };
    },
    componentWillMount: function() {
    },
    preview: function(e) {
        this.setState({html:marked(this.state.data), previewing: true})
    },
    cancelPreview: function(e) {
        this.setState({previewing: false});
    },
    handleChange: function(e) {
        var newData = this.refs.editor.getDOMNode().value;
        var html = this.state.previewing? marked(newData) : this.state.html;
        this.setState({data: newData, html: html});
    },
    render: function() {
        return (
            <div>
                <p><a href="#" 
                    onMouseOver={this.preview}
                    onMouseLeave={this.cancelPreview}>Preview</a></p>
                <textarea ref="editor"
                        value={this.state.data}
                        onChange={this.handleChange}
                        style={{width: "100%"}}
                        rows="10" />
                <div ref="preview"
                    dangerouslySetInnerHTML={{
                        __html: this.state.html
                    }}>
                </div>
            </div>
        );
    }
});