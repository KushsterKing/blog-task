import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import { userActions } from '../_actions';

class HomePage extends React.Component {
    componentDidMount() {
        // this.props.getUsers();
    }

    handleDeleteUser(id) {
        return (e) => this.props.deleteUser(id);
    }

    render() {
        const { user, users } = this.props;
        return (
            <div className="col-md-6 col-md-offset-3">
                { user.role === 'ADMIN'?

                    <ul role="nav">
                        <li><Link to="/admin/user-list">Get Users</Link></li>
                        <li><Link to="/admin/add-user">Add User</Link></li>
                        <li><Link to="/admin/blog-list">Blogs</Link></li>
                    </ul>:
                    <ul role="nav">
                        <li><Link to="/user/add-blog">Add Blogs</Link></li>
                        <li><Link to="/admin/blog-list">Blogs</Link></li>
                    </ul>
                }

                {/*<Navbar bg="dark" variant="dark">*/}
                    {/*<Container>*/}
                        {/*<Nav className="me-auto">*/}
                            {/*<Nav.Link href="admin/get-users">Users</Nav.Link>*/}
                            {/*<Nav.Link href="admin/add-user">Add User</Nav.Link>*/}
                            {/*<Nav.Link href="admin/blogs">Blogs</Nav.Link>*/}
                        {/*</Nav>*/}
                    {/*</Container>*/}
                {/*</Navbar>:*/}

                {/*<Navbar bg="dark" variant="dark">*/}
                    {/*<Container>*/}
                        {/*<Nav className="me-auto">*/}
                            {/*<Nav.Link href="user/">Home</Nav.Link>*/}
                            {/*<Nav.Link href="user/blogs">Blogs</Nav.Link>*/}
                        {/*</Nav>*/}
                    {/*</Container>*/}
                {/*</Navbar>*/}
                <h1>Hi {user.first_name}!</h1>
                <p>You're logged in!!</p>
                {/*<Router history={history}>*/}
                    {/*<Switch>*/}
                        {/*<PrivateRoute exact path="/" component={HomePage} />*/}
                        {/*<Route path="/login" component={LoginPage} />*/}
                        {/*<Route path="/register" component={RegisterPage} />*/}
                        {/*<Redirect from="*" to="/" />*/}
                    {/*</Switch>*/}
                {/*</Router>*/}
                {/*<h3>All registered users:</h3>*/}
                {/*{users.loading && <em>Loading users...</em>}*/}
                {/*{users.error && <span className="text-danger">ERROR: {users.error}</span>}*/}
                {/*{users.items &&*/}
                    {/*<ul>*/}
                        {/*{users.items.map((user, index) =>*/}
                            {/*<li key={user.id}>*/}
                                {/*{user.first_name + ' ' + user.last_name}*/}
                                {/*{*/}
                                    {/*user.deleting ? <em> - Deleting...</em>*/}
                                    {/*: user.deleteError ? <span className="text-danger"> - ERROR: {user.deleteError}</span>*/}
                                    {/*: <span> - <a onClick={this.handleDeleteUser(user._id)}>Delete</a></span>*/}
                                {/*}*/}
                            {/*</li>*/}
                        {/*)}*/}
                    {/*</ul>*/}
                {/*}*/}
                <p>
                    <Link to="/login">Logout</Link>
                </p>
            </div>
        );
    }
}

function mapState(state) {
    const { users, authentication } = state;
    const { user } = authentication;
    return { user, users };
}

const actionCreators = {
    getUsers: userActions.getAll,
    deleteUser: userActions.delete
};

const connectedHomePage = connect(mapState, actionCreators)(HomePage);
export { connectedHomePage as HomePage };