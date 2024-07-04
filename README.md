# Usage (development)
- Run the python server in `PythonServer/app.py`.
- Next, run `pnpm dev` if `pnpm` is installed, or `npx next dev` if you want to use `npx` instead.
- The system for rewards payout has a bug where it will say something along the lines of `"pk value is invalid"`. This only affects the reward payout (`swap`) system.
- The admin, reports, profile, user, and the rest of the rewards system(s) all work perfectly fine.
- If you get an error relating to `typing_extensions`, run `pip install --upgrade typing_extensions` or just disable the reward payout (`swap`) system.
- Thank you for taking the time to read me! Goodbye!
