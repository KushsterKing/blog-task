import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import {blogActions} from "../_actions";

class BlogList extends React.Component {
    componentDidMount() {
        this.props.getBlogs();
    }

    handleDeleteUser(id) {
        return (e) => this.props.deleteBlog(id);
    }

    handleApproveUser(id) {
        return (e) => this.props.approveBlog(id);
    }

    render() {
        console.log(this.props);
        const { blog, blogs } = this.props;
        console.log(blogs, 'blogs');
        return (
            <div className="col-md-6 col-md-offset-3">
                <h3>All registered users:</h3>
                {blogs.loading && <em>Loading users...</em>}
                {blogs.error && <span className="text-danger">ERROR: {blogs.error}</span>}
                {blogs.items &&
                <ul>
                    {blogs.items.map((user, index) =>
                        <li key={user._id}>
                            {user.title + ' ' + user.content}
                            {
                                user.deleting ? <em> - Deleting...</em>
                                    : user.deleteError ? <span className="text-danger"> - ERROR: {user.deleteError}</span>
                                    : <span> - <a onClick={this.handleDeleteUser(user._id)}>Delete</a></span>
                            }
                            {!user.approved &&
                            (user.approving ? <em> - Approving...</em>
                                : user.approveError ? <span className="text-danger"> - ERROR: {user.approveError}</span>
                                : <span> - <a onClick={this.handleApproveUser(user._id)}>Approve</a></span>)
                            }
                        </li>
                    )}
                </ul>
                }
                <p>
                    <Link to="/">Back</Link>
                </p>
            </div>
        );
    }
}

function mapState(state) {

    console.log(state);

    const { blogs } = state;
    return { blogs };
}

const actionCreators = {
    getBlogs: blogActions.getBlogs,
    approveBlog: blogActions.approveBlog,
    deleteBlog: blogActions.delete
};

const connectedBlogList = connect(mapState, actionCreators)(BlogList);
export { connectedBlogList as BlogList };