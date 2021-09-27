import React from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';

import { history } from '../_helpers';
import { alertActions } from '../_actions';
import { PrivateRoute } from '../_components';
import { HomePage } from '../HomePage';
import { LoginPage } from '../LoginPage';
import { RegisterPage } from '../RegisterPage';
import {RoleBasedRouting} from '../RoleBasedRouting'
import {UserList} from "../UsersList/UserList";
import {BlogList} from "../BlogList/BlogList";
import {AddBlog} from "../AddBlog/AddBlog"

class App extends React.Component {
    constructor(props) {
        super(props);

        history.listen((location, action) => {
            // clear alert on location change
            this.props.clearAlerts();
        });
    }

    render() {
        const { alert } = this.props;
        return (
            <div className="jumbotron">
                <div className="container">
                    <div className="col-sm-8 col-sm-offset-2">
                        {alert.message &&
                            <div className={`alert ${alert.type}`}>{alert.message}</div>
                        }
                        <Router history={history}>
                            <Switch>
                                <PrivateRoute exact path="/" component={HomePage} />
                                <Route path="/login" component={LoginPage} />
                                {/*<RoleBasedRouting exact path="/admin" component={LoginPage} roles={['ROLE_ADMIN']} />*/}
                                {/*<RoleBasedRouting exact path="/user" component={UserPage} roles={['ROLE_USER']} />*/}
                                <RoleBasedRouting exact path="/admin/add-user" component={RegisterPage} roles={['ADMIN']}/>
                                <RoleBasedRouting exact path="/admin/user-list" component={UserList} roles={['ADMIN']}/>
                                <RoleBasedRouting exact path="/user/add-blog" component={AddBlog} roles={['CONTENT_WRITER']}/>
                                <RoleBasedRouting exact path="/admin/blog-list" component={BlogList} roles={['ADMIN', 'CONTENT_WRITER']}/>
                                {/*<RoleBasedRouting exact path="/admin/add-user" component={RegisterPage} roles={['ROLE_ADMIN']}/>*/}
                                <Redirect from="*" to="/" />
                            </Switch>
                        </Router>
                    </div>
                </div>
            </div>
        );
    }
}

function mapState(state) {
    const { alert } = state;
    return { alert };
}

const actionCreators = {
    clearAlerts: alertActions.clear
};

const connectedApp = connect(mapState, actionCreators)(App);
export { connectedApp as App };