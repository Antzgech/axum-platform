// Add this BOTTOM NAVIGATION section to your DashboardPage.jsx
// Place it BEFORE the closing </div> of "saba-dashboard full-screen"

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="bottom-nav-bar">
        <Link to="/rewards" className="nav-btn">
          <div className="nav-btn-circle">
            <img src={iconStore} alt="Store" className="nav-icon" />
          </div>
          <span className="nav-label">Store</span>
        </Link>

        <Link to="/game" className="nav-btn">
          <div className="nav-btn-circle">
            <img src={iconBoosts} alt="Game" className="nav-icon" />
          </div>
          <span className="nav-label">Game</span>
        </Link>

        <Link to="/invite" className="nav-btn">
          <div className="nav-btn-circle">
            <img src={iconFriends} alt="Invite" className="nav-icon" />
          </div>
          <span className="nav-label">Invite</span>
        </Link>

        <Link to="/tasks" className="nav-btn">
          <div className="nav-btn-circle">
            <img src={iconEarnCoins} alt="Tasks" className="nav-icon" />
          </div>
          <span className="nav-label">Tasks</span>
        </Link>
      </nav>

      {/* MODALS - Keep at the very end */}
      {showUserInfo && (
        <div className="user-info-popup-overlay" onClick={closeUserInfo}>
          {/* ... existing user info modal ... */}
        </div>
      )}

      {showCheckin && (
        <DailyCheckIn 
          onClose={() => setShowCheckin(false)}
          onClaim={handleCheckinClaim}
        />
      )}

      {showLevelProgress && (
        <LevelProgress 
          user={user}
          onClose={() => setShowLevelProgress(false)}
        />
      )}
    </div>
  );
}
