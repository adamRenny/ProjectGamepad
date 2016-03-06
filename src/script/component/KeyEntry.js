import React, { PropTypes, Component } from 'react';

import {
    filter
} from 'lodash';
import t from 'tcomb';

export default class KeyEntry extends Component {
    static propTypes: {
        keyName: PropTypes.string.ConfigField.isRequired
    }

    render() {
        return (
            <div>
                <label>
                    { this.props.keyName }
                    <button onClick={ this.onClick }>Set</button>
                </label>
            </div>
        );
    }

    onClick = (event) => {
        
    };
}
